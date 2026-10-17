import { prisma } from "../config/db.js";
import { cleanupImageIfUnused } from "../helpers/imageCleanup.js";

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

// Collect candidate URLs before the block content is changed/deleted.
// The cleanup helper will ignore URLs not registered in UploadedImage.
function collectImageUrls(content) {
  return new Set(
    collectStrings(content).filter(
      (value) => value.startsWith("http://") || value.startsWith("https://"),
    ),
  );
}

// Creating a story block
const createStoryBlock = async (req, res) => {
  try {
    const { type, label, content } = req.body;

    const story = await prisma.story.findUnique({
      where: {
        id: req.params.storyId,
      },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "There is no  story to create Story Blocks !",
      });
    }

    if (!type) {
      return res.status(400).json({
        status: "error",
        message: "Type is required!",
      });
    }

    const lastStoryBlock = await prisma.storyBlock.findFirst({
      where: {
        storyId: req.params.storyId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const storyBlock = await prisma.$transaction(async (tx) => {
      const createdBlock = await tx.storyBlock.create({
        data: {
          storyId: story.id,
          type,
          label,
          content,
          position: lastStoryBlock ? lastStoryBlock.position + 1 : 1,
        },
      });

      await tx.story.update({
        where: { id: story.id },
        data: {
          updatedAt: new Date(),
        },
      });

      return createdBlock;
    });

    return res.status(201).json({
      status: "success",
      message: `Created ${storyBlock.type} block successfully.`,
      data: storyBlock,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Get all blocks of a story
const getStoryBlocks = async (req, res) => {
  try {
    const storyBlocks = await prisma.storyBlock.findMany({
      where: {
        storyId: req.params.storyId,
      },
      orderBy: {
        position: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Retrived the story-blocks successfully",
      data: storyBlocks,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update a story block
const updateStoryBlock = async (req, res) => {
  try {
    const { label, content } = req.body;

    const storyBlock = await prisma.storyBlock.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!storyBlock) {
      return res.status(404).json({
        status: "error",
        message: "There is no such story block to update!",
      });
    }

    // Build update data. Omitted fields remain unchanged.
    const updateData = {};

    if (label !== undefined) updateData.label = label;
    if (content !== undefined) updateData.content = content;

    // Collect old image URLs before changing the content.
    const oldImageUrls =
      content !== undefined ? collectImageUrls(storyBlock.content) : new Set();

    // Update the block and its parent Story atomically.
    const updatedStoryBlock = await prisma.$transaction(async (tx) => {
      await tx.storyBlock.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await tx.story.update({
        where: { id: storyBlock.storyId },
        data: {
          updatedAt: new Date(),
        },
      });

      return tx.storyBlock.findUnique({
        where: { id: req.params.id },
      });
    });

    // Only consider old URLs after the database update succeeds.
    if (content !== undefined) {
      const newImageUrls = collectImageUrls(updatedStoryBlock.content);

      for (const oldImageUrl of oldImageUrls) {
        if (!newImageUrls.has(oldImageUrl)) {
          await cleanupImageIfUnused(oldImageUrl);
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Updated the story block successfully!",
      data: updatedStoryBlock,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Deleting a story block
const deleteStoryBlock = async (req, res) => {
  try {
    const storyBlock = await prisma.storyBlock.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!storyBlock) {
      return res.status(404).json({
        status: "error",
        message: "There no StoryBlock to delete",
      });
    }

    // Collect URLs before deleting the block's content.
    const imageUrls = collectImageUrls(storyBlock.content);

    // Delete the block and update the parent Story atomically.
    await prisma.$transaction(async (tx) => {
      await tx.storyBlock.delete({
        where: {
          id: req.params.id,
        },
      });

      await tx.story.update({
        where: { id: storyBlock.storyId },
        data: {
          updatedAt: new Date(),
        },
      });
    });

    // Cleanup only after successful database deletion.
    for (const imageUrl of imageUrls) {
      await cleanupImageIfUnused(imageUrl);
    }

    return res.status(200).json({
      status: "success",
      message: "Story Block deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Reordering the Story Blocks
const reorderStoryBlocks = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Bad Reorder Request!!",
      });
    }

    const blocks = await prisma.storyBlock.findMany({
      where: {
        storyId,
      },
      select: {
        id: true,
      },
    });

    const blockIds = blocks.map((block) => block.id);

    if (orderedIds.length !== blockIds.length) {
      return res.status(400).json({
        status: "error",
        message: "Length of blocks are not matching!!",
      });
    }

    const blockIdsSet = new Set(blockIds);
    const orderedIdsSet = new Set(orderedIds);

    if (orderedIdsSet.size !== orderedIds.length) {
      return res.status(400).json({
        status: "error",
        message: "Duplicate block IDs are not allowed",
      });
    }

    if (orderedIds.some((id) => !blockIdsSet.has(id))) {
      return res.status(400).json({
        status: "error",
        message: "One or more block IDs are invalid",
      });
    }

    await prisma.$transaction(
      async (tx) => {
        for (let index = 0; index < orderedIds.length; index++) {
          await tx.storyBlock.update({
            where: {
              id: orderedIds[index],
            },
            data: {
              position: index + 1,
            },
          });
        }

        await tx.story.update({
          where: {
            id: storyId,
          },
          data: {
            updatedAt: new Date(),
          },
        });
      },
      {
        timeout: 10000,
      },
    );

    return res.status(200).json({
      status: "success",
      message: "Story blocks reordered successfully",
    });
  } catch (error) {
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
  updateStoryBlock,
  reorderStoryBlocks,
};
