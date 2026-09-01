import { prisma } from "../config/db.js";

// add progress of a story
const addStoryProgress = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    if (!storyId) {
      return res.status(400).json({
        status: "error",
        message: "Story ID is required",
      });
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: {
        id: storyId,
      },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "Story not found",
      });
    }

    // Check existing progress
    const existingProgress = await prisma.storyProgress.findFirst({
      where: {
        userId,
        storyId,
      },
    });

    if (existingProgress) {
      return res.status(200).json({
        status: "success",
        message: "Story progress already exists",
        data: existingProgress,
      });
    }

    // Create progress
    const progress = await prisma.storyProgress.create({
      data: {
        userId,
        storyId,
        blocksRead: 0,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Story progress created successfully",
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// update the progress of a story
const updateStoryProgress = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { blocksRead } = req.body;
    const userId = req.user.id;

    if (!storyId) {
      return res.status(400).json({
        status: "error",
        message: "Story ID is required",
      });
    }

    if (blocksRead === undefined || blocksRead < 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid blocksRead is required",
      });
    }

    const progress = await prisma.storyProgress.findFirst({
      where: {
        userId,
        storyId,
      },
    });

    if (!progress) {
      return res.status(404).json({
        status: "error",
        message: "Story progress not found",
      });
    }

    const totalBlocks = await prisma.storyBlock.count({
      where: {
        storyId,
      },
    });

    // Never decrease progress
    const maxBlocksRead = Math.max(progress.blocksRead, blocksRead);

    const percentage =
      totalBlocks > 0 ? Math.round((maxBlocksRead / totalBlocks) * 100) : 0;

    const storyCompleted = percentage >= 100;

    const updatedProgress = await prisma.storyProgress.update({
      where: {
        id: progress.id,
      },
      data: {
        blocksRead: maxBlocksRead,
        storyCompleted,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Progress updated successfully",
      data: {
        ...updatedProgress,
        totalBlocks,
        percentage,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get the Progress
const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const progressList = await prisma.storyProgress.findMany({
      where: {
        userId,
        OR: [
          {
            storyCompleted: false,
          },
          {
            storyCompleted: true,
            quizCompleted: false,
          },
        ],
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const data = await Promise.all(
      progressList.map(async (item) => {
        const totalBlocks = await prisma.storyBlock.count({
          where: {
            storyId: item.storyId,
          },
        });

        const progressPercentage =
          totalBlocks > 0
            ? Math.round((item.blocksRead / totalBlocks) * 100)
            : 0;

        return {
          storyId: item.story.id,
          title: item.story.title,
          imageUrl: item.story.imageUrl,
          blocksRead: item.blocksRead,
          totalBlocks,
          progressPercentage,
          storyCompleted: item.storyCompleted,
          quizCompleted: item.quizCompleted,
        };
      }),
    );

    return res.status(200).json({
      status: "success",
      message: "Retrived the student progress!",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export { addStoryProgress, updateStoryProgress, getProgress };
