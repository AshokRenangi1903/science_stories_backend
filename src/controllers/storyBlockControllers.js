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

// Create a StoryBlock and its sentence/audio jobs atomically.
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

      // Create all 12 audio jobs inside the same transaction.
      for (const sentenceId of createdSentenceIds) {
        await enqueueSentenceAudioJobs(sentenceId, tx);
      }

      await tx.story.update({
        where: { id: story.id },
        data: { updatedAt: new Date() },
      });

      return createdBlock;
    });

    return res.status(201).json({
      status: "success",
      message: `Created ${result.type} block successfully.`,
      data: result,
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
      include: {
        sentences: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            text: true,
            position: true,
            audioVariants: {
              select: {
                languageCode: true,
                voiceName: true,
                status: true,
                audioUrl: true,
                durationMs: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json({
      status: "success",
      message: "Retrieved the story blocks successfully.",
      data: storyBlocks,
    });
  } catch (error) {
    console.error("getStoryBlocks error:", error);

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

    const updatedBlock = await prisma.$transaction(async (tx) => {
      await tx.storyBlock.update({
        where: { id },
        data: updateData,
      });

      const currentBlock = await tx.storyBlock.findUnique({
        where: { id },
      });

      // Only synchronize sentences when content is provided.
      if (content !== undefined) {
        const { createdSentenceIds } = await syncStoryBlockSentences(
          tx,
          currentBlock,
        );

        // New sentences and their audio jobs commit together.
        for (const sentenceId of createdSentenceIds) {
          await enqueueSentenceAudioJobs(sentenceId, tx);
        }
      }

      await tx.story.update({
        where: { id: storyBlock.storyId },
        data: { updatedAt: new Date() },
      });

      return currentBlock;
    });

    // Clean up removed images only after a successful update.
    if (content !== undefined) {
      const newImageUrls = collectImageUrls(updatedBlock.content);

      for (const oldImageUrl of oldImageUrls) {
        if (!newImageUrls.has(oldImageUrl)) {
          try {
            await cleanupImageIfUnused(oldImageUrl);
          } catch (error) {
            // Image cleanup must not undo a successful database update.
            console.error(
              `Image cleanup failed for ${oldImageUrl}:`,
              error.message,
            );
          }
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Updated the story block successfully!",
      data: updatedBlock,
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
      try {
        await cleanupImageIfUnused(imageUrl);
      } catch (error) {
        console.error(`Image cleanup failed for ${imageUrl}:`, error.message);
      }
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

    if (orderedIds.some((blockId) => !blockIdsSet.has(blockId))) {
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
