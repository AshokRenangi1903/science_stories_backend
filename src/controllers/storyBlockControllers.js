import { prisma } from "../config/db.js";
import { cleanupImageIfUnused } from "../helpers/imageCleanup.js";
import { syncStoryBlockSentences } from "../helpers/sentenceSync.js";
import { enqueueSentenceAudioJobs } from "../services/sentenceAudioQueue.js";

// Collect strings from nested StoryBlock JSON content.
function collectStrings(value, result = []) {
  if (typeof value === "string") {
    result.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, result);
    }
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, result);
    }
  }

  return result;
}

// Collect candidate URLs before block content changes/deletes.
function collectImageUrls(content) {
  return new Set(
    collectStrings(content).filter(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
    ),
  );
}

// Enqueue only newly created sentences, after the transaction commits.
async function enqueueCreatedSentences(sentenceIds) {
  for (const sentenceId of sentenceIds) {
    try {
      await enqueueSentenceAudioJobs(sentenceId);
    } catch (error) {
      console.error(
        `Failed to enqueue audio for sentence ${sentenceId}:`,
        error.message,
      );
    }
  }
}

// Create a StoryBlock.
const createStoryBlock = async (req, res) => {
  try {
    const { type, label, content } = req.body;
    const { storyId } = req.params;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "There is no story to create StoryBlocks for.",
      });
    }

    if (!type) {
      return res.status(400).json({
        status: "error",
        message: "Type is required!",
      });
    }

    const lastStoryBlock = await prisma.storyBlock.findFirst({
      where: { storyId },
      orderBy: { position: "desc" },
    });

    const result = await prisma.$transaction(async (tx) => {
      const createdBlock = await tx.storyBlock.create({
        data: {
          storyId: story.id,
          type,
          label,
          content,
          position: lastStoryBlock ? lastStoryBlock.position + 1 : 1,
        },
      });

      const { createdSentenceIds } = await syncStoryBlockSentences(
        tx,
        createdBlock,
      );

      await tx.story.update({
        where: { id: story.id },
        data: { updatedAt: new Date() },
      });

      return {
        storyBlock: createdBlock,
        createdSentenceIds,
      };
    });

    // Run only after the database transaction succeeds.
    await enqueueCreatedSentences(result.createdSentenceIds);

    return res.status(201).json({
      status: "success",
      message: `Created ${result.storyBlock.type} block successfully.`,
      data: result.storyBlock,
    });
  } catch (error) {
    console.error("createStoryBlock error:", error);

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all blocks of a story.
const getStoryBlocks = async (req, res) => {
  try {
    const storyBlocks = await prisma.storyBlock.findMany({
      where: { storyId: req.params.storyId },
      orderBy: { position: "asc" },
    });

    return res.status(200).json({
      status: "success",
      message: "Retrieved the story blocks successfully.",
      data: storyBlocks,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update a StoryBlock.
const updateStoryBlock = async (req, res) => {
  try {
    const { label, content } = req.body;
    const { id } = req.params;

    const storyBlock = await prisma.storyBlock.findUnique({
      where: { id },
    });

    if (!storyBlock) {
      return res.status(404).json({
        status: "error",
        message: "There is no such story block to update!",
      });
    }

    // Omitted fields remain unchanged.
    const updateData = {};

    if (label !== undefined) {
      updateData.label = label;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    const oldImageUrls =
      content !== undefined ? collectImageUrls(storyBlock.content) : new Set();

    const result = await prisma.$transaction(async (tx) => {
      await tx.storyBlock.update({
        where: { id },
        data: updateData,
      });

      const updatedBlock = await tx.storyBlock.findUnique({
        where: { id },
      });

      let createdSentenceIds = [];

      // Synchronize sentences only when content changes.
      if (content !== undefined) {
        const syncResult = await syncStoryBlockSentences(tx, updatedBlock);

        createdSentenceIds = syncResult.createdSentenceIds;
      }

      await tx.story.update({
        where: { id: storyBlock.storyId },
        data: { updatedAt: new Date() },
      });

      return {
        updatedBlock,
        createdSentenceIds,
      };
    });

    // Enqueue new sentences after the transaction commits.
    await enqueueCreatedSentences(result.createdSentenceIds);

    // Clean up removed images only after a successful update.
    if (content !== undefined) {
      const newImageUrls = collectImageUrls(result.updatedBlock.content);

      for (const oldImageUrl of oldImageUrls) {
        if (!newImageUrls.has(oldImageUrl)) {
          await cleanupImageIfUnused(oldImageUrl);
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Updated the story block successfully!",
      data: result.updatedBlock,
    });
  } catch (error) {
    console.error("updateStoryBlock error:", error);

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete a StoryBlock.
const deleteStoryBlock = async (req, res) => {
  try {
    const { id } = req.params;

    const storyBlock = await prisma.storyBlock.findUnique({
      where: { id },
    });

    if (!storyBlock) {
      return res.status(404).json({
        status: "error",
        message: "There is no StoryBlock to delete.",
      });
    }

    const imageUrls = collectImageUrls(storyBlock.content);

    await prisma.$transaction(async (tx) => {
      await tx.storyBlock.delete({
        where: { id },
      });

      await tx.story.update({
        where: { id: storyBlock.storyId },
        data: { updatedAt: new Date() },
      });
    });

    for (const imageUrl of imageUrls) {
      await cleanupImageIfUnused(imageUrl);
    }

    return res.status(200).json({
      status: "success",
      message: "StoryBlock deleted successfully.",
    });
  } catch (error) {
    console.error("deleteStoryBlock error:", error);

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Reorder StoryBlocks.
const reorderStoryBlocks = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        status: "error",
        message: "orderedIds must be an array.",
      });
    }

    const blocks = await prisma.storyBlock.findMany({
      where: { storyId },
      select: { id: true },
    });

    const blockIds = blocks.map((block) => block.id);

    if (orderedIds.length !== blockIds.length) {
      return res.status(400).json({
        status: "error",
        message: "Length of blocks are not matching!",
      });
    }

    const blockIdsSet = new Set(blockIds);
    const orderedIdsSet = new Set(orderedIds);

    if (orderedIdsSet.size !== orderedIds.length) {
      return res.status(400).json({
        status: "error",
        message: "Duplicate block IDs are not allowed.",
      });
    }

    if (orderedIds.some((id) => !blockIdsSet.has(id))) {
      return res.status(400).json({
        status: "error",
        message: "One or more block IDs are invalid.",
      });
    }

    await prisma.$transaction(
      async (tx) => {
        for (let index = 0; index < orderedIds.length; index++) {
          await tx.storyBlock.update({
            where: { id: orderedIds[index] },
            data: { position: index + 1 },
          });
        }

        await tx.story.update({
          where: { id: storyId },
          data: { updatedAt: new Date() },
        });
      },
      { timeout: 10000 },
    );

    return res.status(200).json({
      status: "success",
      message: "Story blocks reordered successfully.",
    });
  } catch (error) {
    console.error("reorderStoryBlocks error:", error);

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export {
  createStoryBlock,
  deleteStoryBlock,
  getStoryBlocks,
  reorderStoryBlocks,
  updateStoryBlock,
};
