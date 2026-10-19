import { extractSentences } from "./sentenceExtractor.js";

async function syncStoryBlockSentences(tx, storyBlock) {
  const storyBlockId = storyBlock.id;
  const sentences = extractSentences(storyBlock);

  const existing = await tx.storyBlockSentence.findMany({
    where: { storyBlockId },
    orderBy: { position: "asc" },
  });

  const existingByKey = new Map();

  for (const sentence of existing) {
    const key = `${sentence.textHash}:${sentence.text}`;
    const queue = existingByKey.get(key) ?? [];

    queue.push(sentence);
    existingByKey.set(key, queue);
  }

  const retainedIds = [];
  const createdSentenceIds = [];

  for (const sentence of sentences) {
    const key = `${sentence.textHash}:${sentence.text}`;
    const queue = existingByKey.get(key);
    const previous = queue?.shift();

    if (previous) {
      retainedIds.push(previous.id);

      if (previous.position !== sentence.position) {
        await tx.storyBlockSentence.update({
          where: { id: previous.id },
          data: { position: sentence.position },
        });
      }

      continue;
    }

    const created = await tx.storyBlockSentence.create({
      data: {
        storyBlockId,
        text: sentence.text,
        textHash: sentence.textHash,
        position: sentence.position,
      },
    });

    retainedIds.push(created.id);
    createdSentenceIds.push(created.id);
  }

  await tx.storyBlockSentence.deleteMany({
    where: {
      storyBlockId,
      ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}),
    },
  });

  return {
    retainedIds,
    createdSentenceIds,
  };
}

export { syncStoryBlockSentences };
