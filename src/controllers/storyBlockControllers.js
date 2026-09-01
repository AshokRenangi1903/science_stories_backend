import { prisma } from "../config/db.js";

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

    // const storyBlock = await prisma.storyBlock.create({
    //   data: {
    //     storyId: story.id,
    //     type,
    //     label,
    //     content,
    //     position: lastStoryBlock ? lastStoryBlock.position + 1 : 1,
    //   },
    // });

    const storyBlock = await prisma.$transaction(async (tx) => {
      const storyBlock = await prisma.storyBlock.create({
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
      return storyBlock;
    });

    res.status(201).json({
      status: "success",
      message: `Created ${storyBlock.type} block successfully.`,
      data: storyBlock,
    });
  } catch (error) {
    res.status(500).json({
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

    res.status(200).json({
      status: "success",
      message: `Retrived the story-blocks successfully`,
      data: storyBlocks,
    });
  } catch (error) {
    res.status(500).json({
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

    // Build update data
    const updateData = {};
    if (label !== undefined) updateData.label = label;
    if (content !== undefined) updateData.content = content;

    // Transaction
    await prisma.$transaction(async (tx) => {
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
    });

    const updatedStoryBlock = await prisma.storyBlock.findUnique({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Updated the story block successfully!",
      data: updatedStoryBlock,
    });
  } catch (error) {
    res.status(500).json({
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

    // await prisma.storyBlock.delete({
    //   where: {
    //     id: req.params.id,
    //   },
    // });

    // Transaction
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

    res.status(200).json({
      status: "success",
      message: "Story Block deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
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
    });
    const blockIds = blocks.map((block) => block.id);

    if (orderedIds.length !== blockIds.length) {
      return res.status(400).json({
        status: "error",
        message: "Length of blocks are not matching!!",
      });
    }

    for (const id of orderedIds) {
      const isValidId = blockIds.includes(id);

      if (!isValidId) {
        return res.status(400).json({
          status: "error",
          message: "One or more block IDs are invalid",
        });
      }
    }

    const orderedIdsSet = new Set(orderedIds);

    if (orderedIds.length !== orderedIdsSet.size) {
      return res.status(400).json({
        status: "error",
        message: "Duplicate block IDs are not allowed",
      });
    }

    // const updates = orderedIds.map((id, index) => {
    //   return prisma.storyBlock.update({
    //     where: {
    //       id: id,
    //     },
    //     data: {
    //       position: index + 1,
    //     },
    //   });
    // });

    // await prisma.$transaction(updates, { timeout: 10000 });

    const updates = orderedIds.map((id, index) => {
      return prisma.storyBlock.update({
        where: {
          id,
        },
        data: {
          position: index + 1,
        },
      });
    });

    await prisma.$transaction(
      async (tx) => {
        await Promise.all(updates);

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

    res.status(200).json({
      status: "success",
      message: "Story blocks reordered successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// exports
export {
  createStoryBlock,
  deleteStoryBlock,
  getStoryBlocks,
  updateStoryBlock,
  reorderStoryBlocks,
};
