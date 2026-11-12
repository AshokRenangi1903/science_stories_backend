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

// Get complete student progress for the My Progress page
const getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all published stories with their era and block count.
    const stories = await prisma.story.findMany({
      where: {
        isPublished: true,
        era: {
          isPublished: true,
        },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        subject: true,
        eraId: true,
        era: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            blocks: true,
          },
        },
      },
      orderBy: [{ era: { position: "asc" } }, { position: "asc" }],
    });

    const storyIds = stories.map((story) => story.id);

    // Fetch this student's progress for published stories.
    const progressRecords = await prisma.storyProgress.findMany({
      where: {
        userId,
        storyId: {
          in: storyIds,
        },
      },
    });

    const progressMap = new Map(
      progressRecords.map((progress) => [progress.storyId, progress]),
    );

    // Fetch all completed quiz attempts.
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        score: true,
        accuracy: true,
        totalQuestions: true,
        timeTaken: true,
        questionAttempts: {
          select: {
            isCorrect: true,
          },
        },
      },
    });

    // Build story-level progress data.
    const storyProgressData = stories.map((story) => {
      const progress = progressMap.get(story.id);
      const totalBlocks = story._count.blocks;
      const blocksRead = progress?.blocksRead ?? 0;

      const readingPercentage =
        totalBlocks > 0
          ? Math.min(100, Math.round((blocksRead / totalBlocks) * 100))
          : 0;

      // Quiz submission is the source of truth for completion.
      const isCompleted = progress?.quizCompleted ?? false;

      return {
        storyId: story.id,
        title: story.title,
        imageUrl: story.imageUrl,
        subject: story.subject,
        eraId: story.eraId,
        eraTitle: story.era.title,
        eraImageUrl: story.era.imageUrl,
        blocksRead,
        totalBlocks,
        readingPercentage,
        storyCompleted: isCompleted,
        quizCompleted: isCompleted,
        completedAt: progress?.completedAt ?? null,
        startedAt: progress?.startedAt ?? null,
      };
    });

    // Overview statistics.
    const totalStories = stories.length;

    const completedStories = storyProgressData.filter(
      (story) => story.storyCompleted,
    ).length;

    const startedStories = storyProgressData.filter(
      (story) => story.startedAt !== null,
    ).length;

    const inProgressStories = storyProgressData.filter(
      (story) => story.startedAt !== null && !story.storyCompleted,
    ).length;

    const totalBlocks = storyProgressData.reduce(
      (sum, story) => sum + story.totalBlocks,
      0,
    );

    const totalBlocksRead = storyProgressData.reduce(
      (sum, story) => sum + story.blocksRead,
      0,
    );

    const overallReadingPercentage =
      totalBlocks > 0 ? Math.round((totalBlocksRead / totalBlocks) * 100) : 0;

    // Group stories by era.
    const eraMap = new Map();

    for (const story of storyProgressData) {
      if (!eraMap.has(story.eraId)) {
        eraMap.set(story.eraId, {
          eraId: story.eraId,
          eraTitle: story.eraTitle,
          imageUrl: story.eraImageUrl,
          totalStories: 0,
          completedStories: 0,
        });
      }

      const era = eraMap.get(story.eraId);
      era.totalStories++;

      if (story.storyCompleted) {
        era.completedStories++;
      }
    }

    const eraProgress = Array.from(eraMap.values()).map((era) => ({
      ...era,
      percentage:
        era.totalStories > 0
          ? Math.round((era.completedStories / era.totalStories) * 100)
          : 0,
    }));

    // Group stories by subject.
    const subjectMap = new Map();

    for (const story of storyProgressData) {
      const subject = story.subject ?? "UNCATEGORIZED";

      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          totalStories: 0,
          completedStories: 0,
        });
      }

      const item = subjectMap.get(subject);
      item.totalStories++;

      if (story.storyCompleted) {
        item.completedStories++;
      }
    }

    const subjectProgress = Array.from(subjectMap.values()).map((item) => ({
      ...item,
      percentage:
        item.totalStories > 0
          ? Math.round((item.completedStories / item.totalStories) * 100)
          : 0,
    }));

    // Quiz statistics.
    const totalAttempts = quizAttempts.length;

    const totalAccuracy = quizAttempts.reduce(
      (sum, attempt) => sum + attempt.accuracy,
      0,
    );

    const totalCorrectAnswers = quizAttempts.reduce(
      (sum, attempt) =>
        sum +
        attempt.questionAttempts.filter((question) => question.isCorrect)
          .length,
      0,
    );

    const totalAttemptedAnswers = quizAttempts.reduce(
      (sum, attempt) => sum + attempt.questionAttempts.length,
      0,
    );

    const bestScore =
      quizAttempts.length > 0
        ? Math.max(...quizAttempts.map((attempt) => attempt.score))
        : 0;

    const quizStatistics = {
      totalAttempts,
      averageAccuracy:
        totalAttempts > 0
          ? Number((totalAccuracy / totalAttempts).toFixed(2))
          : 0,
      bestScore,
      totalCorrectAnswers,
      totalIncorrectAnswers: totalAttemptedAnswers - totalCorrectAnswers,
      totalAttemptedAnswers,
    };

    // Completed stories, newest completion first.
    const completedStoriesList = storyProgressData
      .filter((story) => story.storyCompleted)
      .sort(
        (a, b) => new Date(b.completedAt ?? 0) - new Date(a.completedAt ?? 0),
      );

    return res.status(200).json({
      status: "success",
      message: "Student progress retrieved successfully",
      data: {
        overview: {
          totalStories,
          completedStories,
          startedStories,
          inProgressStories,
          totalBlocks,
          totalBlocksRead,
          overallReadingPercentage,
        },
        eraProgress,
        subjectProgress,
        quizStatistics,
        completedStories: completedStoriesList,
      },
    });
  } catch (error) {
    console.error("Get My Progress Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve student progress",
    });
  }
};

// Update the reading progress of a story
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

    if (!Number.isInteger(blocksRead) || blocksRead < 0) {
      return res.status(400).json({
        status: "error",
        message: "blocksRead must be a non-negative integer",
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

    // Never decrease progress or exceed the total block count.
    const maxBlocksRead = Math.min(
      Math.max(progress.blocksRead, blocksRead),
      totalBlocks,
    );

    const percentage =
      totalBlocks > 0 ? Math.round((maxBlocksRead / totalBlocks) * 100) : 0;

    const updatedProgress = await prisma.storyProgress.update({
      where: {
        id: progress.id,
      },
      data: {
        blocksRead: maxBlocksRead,
        // storyCompleted is intentionally not updated here.
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Reading progress updated successfully",
      data: {
        ...updatedProgress,
        totalBlocks,
        percentage,
      },
    });
  } catch (error) {
    return res.status(500).json({
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

export { addStoryProgress, updateStoryProgress, getProgress, getMyProgress };
