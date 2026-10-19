
import { prisma } from "../config/db.js";

const LANGUAGES = ["en-US", "en-IN"];

const VOICES = [
  "Algenib",
  "Algieba",
  "Charon",
  "Despina",
  "Erinome",
  "Gacrux",
];

async function enqueueSentenceAudioJobs(sentenceId) {
  const sentence = await prisma.storyBlockSentence.findUnique({
    where: { id: sentenceId },
    select: { id: true },
  });

  if (!sentence) {
    throw new Error(`Sentence not found: ${sentenceId}`);
  }

  const jobs = [];

  for (const languageCode of LANGUAGES) {
    for (const voice of VOICES) {
      jobs.push({
        sentenceId,
        languageCode,
        voiceName: `${languageCode}-Chirp3-HD-${voice}`,
      });
    }
  }

  await prisma.$transaction(
    jobs.map((job) =>
      prisma.sentenceAudio.upsert({
        where: {
          sentenceId_languageCode_voiceName: {
            sentenceId: job.sentenceId,
            languageCode: job.languageCode,
            voiceName: job.voiceName,
          },
        },
        create: job,
        update: {},
      }),
    ),
  );

  return jobs.length;
}

export { enqueueSentenceAudioJobs };
