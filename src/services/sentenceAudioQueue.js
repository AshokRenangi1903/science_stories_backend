import { prisma } from "../config/db.js";

const LANGUAGES = ["en-US", "en-IN"];

const VOICES = ["Algenib", "Algieba", "Charon", "Despina", "Erinome", "Gacrux"];

async function enqueueWithClient(client, sentenceId) {
  const sentence = await client.storyBlockSentence.findUnique({
    where: { id: sentenceId },
    select: { id: true },
  });

  if (!sentence) {
    throw new Error(`Sentence not found: ${sentenceId}`);
  }

  const jobs = LANGUAGES.flatMap((languageCode) =>
    VOICES.map((voice) => ({
      sentenceId,
      languageCode,
      voiceName: `${languageCode}-Chirp3-HD-${voice}`,
    })),
  );

  for (const job of jobs) {
    await client.sentenceAudio.upsert({
      where: {
        sentenceId_languageCode_voiceName: {
          sentenceId: job.sentenceId,
          languageCode: job.languageCode,
          voiceName: job.voiceName,
        },
      },
      create: job,
      update: {},
    });

    await client.sentenceAudio.updateMany({
      where: {
        sentenceId: job.sentenceId,
        languageCode: job.languageCode,
        voiceName: job.voiceName,
        status: "FAILED",
      },
      data: {
        status: "PENDING",
        attemptCount: 0,
        errorMessage: null,
        audioUrl: null,
        storagePath: null,
        durationMs: null,
      },
    });
  }

  return jobs.length;
}

async function enqueueSentenceAudioJobs(sentenceId, tx = null) {
  // Reuse the caller's transaction when provided.
  if (tx) {
    return enqueueWithClient(tx, sentenceId);
  }

  // Otherwise, create a standalone transaction.
  return prisma.$transaction((client) => enqueueWithClient(client, sentenceId));
}

export { enqueueSentenceAudioJobs };
