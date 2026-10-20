import { prisma } from "../config/db.js";
import { synthesizeSpeech } from "./ttsServices.js";
import { saveSentenceAudio } from "../helpers/audioStorage.js";
import { parseBuffer } from "music-metadata";

const MAX_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 3000;
const RETRY_DELAY_MS = 15000;
const STALE_JOB_MINUTES = 15;
const BATCH_SIZE = 3;

let workerRunning = false;
let workerPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getErrorMessage(error) {
  return String(error?.message || "Unknown audio generation error").slice(
    0,
    1000,
  );
}

async function recoverStaleJobs() {
  const cutoff = new Date(Date.now() - STALE_JOB_MINUTES * 60 * 1000);

  const result = await prisma.sentenceAudio.updateMany({
    where: {
      status: "PROCESSING",
      updatedAt: { lte: cutoff },
    },
    data: {
      status: "PENDING",
      errorMessage: "Recovered stale job after worker interruption.",
    },
  });

  if (result.count > 0) {
    console.warn(`Recovered ${result.count} stale audio job(s).`);
  }
}

async function processSentenceAudioJob(audioJobId) {
  // Atomic claim: only one worker can claim a PENDING job.
  const claimed = await prisma.sentenceAudio.updateMany({
    where: {
      id: audioJobId,
      status: "PENDING",
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      errorMessage: null,
    },
  });

  if (claimed.count === 0) {
    return false;
  }

  try {
    const job = await prisma.sentenceAudio.findUnique({
      where: { id: audioJobId },
      include: { sentence: true },
    });

    if (!job?.sentence) {
      throw new Error("Audio job or sentence not found.");
    }

    const audioContent = await synthesizeSpeech(
      job.sentence.text,
      job.voiceName,
      job.languageCode,
    );
    const metadata = await parseBuffer(audioContent, "audio/mpeg");

    const durationMs = Number.isFinite(metadata.format.duration)
      ? Math.round(metadata.format.duration * 1000)
      : null;

    const saved = await saveSentenceAudio({
      sentenceId: job.sentenceId,
      languageCode: job.languageCode,
      voiceName: job.voiceName,
      audioContent,
    });

    await prisma.sentenceAudio.update({
      where: { id: job.id },
      data: {
        status: "READY",
        audioUrl: saved.audioUrl,
        storagePath: saved.storagePath,
        errorMessage: null,
        durationMs,
      },
    });

    console.log(
      `TTS READY: sentence=${job.sentenceId}, voice=${job.voiceName}`,
    );

    return true;
  } catch (error) {
    const message = getErrorMessage(error);

    try {
      const currentJob = await prisma.sentenceAudio.findUnique({
        where: { id: audioJobId },
        select: { attemptCount: true },
      });

      const attempts = currentJob?.attemptCount ?? MAX_ATTEMPTS;
      const canRetry = attempts < MAX_ATTEMPTS;

      await prisma.sentenceAudio.update({
        where: { id: audioJobId },
        data: {
          status: canRetry ? "PENDING" : "FAILED",
          errorMessage: message,
        },
      });

      console.error(
        `TTS ${canRetry ? "RETRY SCHEDULED" : "FAILED"}: job=${audioJobId}, attempt=${attempts}, error=${message}`,
      );
    } catch (updateError) {
      console.error(
        `Could not update failed TTS job ${audioJobId}:`,
        getErrorMessage(updateError),
      );
    }

    return false;
  }
}

async function workerLoop() {
  console.log("Sentence audio worker started.");

  let lastRecoveryTime = 0;

  while (workerRunning) {
    try {
      // Periodically recover jobs interrupted by a server restart.
      if (Date.now() - lastRecoveryTime >= 60_000) {
        await recoverStaleJobs();
        lastRecoveryTime = Date.now();
      }

      const retryCutoff = new Date(Date.now() - RETRY_DELAY_MS);

      const jobs = await prisma.sentenceAudio.findMany({
        where: {
          status: "PENDING",
          OR: [{ errorMessage: null }, { updatedAt: { lte: retryCutoff } }],
        },
        orderBy: { createdAt: "asc" },
        take: BATCH_SIZE,
        select: { id: true },
      });

      if (jobs.length === 0) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      // Process a small batch concurrently to avoid overwhelming TTS.
      await Promise.all(jobs.map((job) => processSentenceAudioJob(job.id)));
    } catch (error) {
      console.error(
        "Sentence audio worker loop error:",
        getErrorMessage(error),
      );
      await sleep(POLL_INTERVAL_MS);
    }
  }

  console.log("Sentence audio worker stopped.");
}

function startSentenceAudioWorker() {
  if (workerRunning) {
    console.log("Sentence audio worker is already running.");
    return workerPromise;
  }

  workerRunning = true;
  workerPromise = workerLoop().finally(() => {
    workerRunning = false;
    workerPromise = null;
  });

  return workerPromise;
}

async function stopSentenceAudioWorker() {
  workerRunning = false;

  if (workerPromise) {
    await workerPromise;
  }
}

export {
  processSentenceAudioJob,
  startSentenceAudioWorker,
  stopSentenceAudioWorker,
};
