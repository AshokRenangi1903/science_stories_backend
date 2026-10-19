import { prisma } from "../config/db.js";
import { synthesizeSpeech } from "./ttsServices.js";
import { saveSentenceAudio } from "../helpers/audioStorage.js";

async function processSentenceAudioJob(audioJobId) {
  // Claim only a PENDING job so two workers don't process it together.
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
      throw new Error("Audio job or sentence not found");
    }

    const audioContent = await synthesizeSpeech(
      job.sentence.text,
      job.voiceName,
      job.languageCode,
    );

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
      },
    });

    return true;
  } catch (error) {
    await prisma.sentenceAudio.update({
      where: { id: audioJobId },
      data: {
        status: "FAILED",
        errorMessage: String(error.message).slice(0, 1000),
      },
    });

    return false;
  }
}

export { processSentenceAudioJob };
