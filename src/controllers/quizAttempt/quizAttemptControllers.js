import { prisma } from "../../config/db.js";

const startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    if (!quizId) {
      return res.status(400).json({
        status: "error",
        message: "Quiz ID is required",
      });
    }

    // Check quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({
        status: "error",
        message: "Quiz not found",
      });
    }

    // Check unfinished attempt
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
        status: "IN_PROGRESS",
      },
    });

    if (existingAttempt) {
      return res.status(200).json({
        status: "success",
        message: "Resuming existing quiz attempt",
        data: existingAttempt,
      });
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        totalQuestions: quiz.questions.length,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Quiz started successfully",
      data: attempt,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const finishQuiz = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        quiz: {
          include: {
            story: true,
          },
        },
      },
    });

    if (!quizAttempt) {
      return res.status(404).json({
        status: "error",
        message: "Quiz attempt not found",
      });
    }

    if (quizAttempt.status === "COMPLETED") {
      return res.status(400).json({
        status: "error",
        message: "Quiz already completed",
      });
    }

    const completedAt = new Date();

    const timeTaken = Math.floor((completedAt - quizAttempt.startedAt) / 1000);

    const updatedAttempt = await prisma.quizAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        status: "COMPLETED",
        completedAt,
        timeTaken,
      },
    });

    // Update story progress
    await prisma.storyProgress.updateMany({
      where: {
        userId: quizAttempt.userId,
        storyId: quizAttempt.quiz.storyId,
      },
      data: {
        quizCompleted: true,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Quiz completed successfully",
      data: {
        attemptId: updatedAttempt.id,
        score: updatedAttempt.score,
        accuracy: updatedAttempt.accuracy,
        timeTaken: updatedAttempt.timeTaken,
        completedAt: updatedAttempt.completedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getQuizReview = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    if (!storyId) {
      return res.status(400).json({
        status: "error",
        message: "Story ID is required",
      });
    }

    // Latest completed attempt for this story
    const latestAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        status: "COMPLETED",
        quiz: {
          storyId,
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!latestAttempt) {
      return res.status(404).json({
        status: "error",
        message: "No completed quiz attempt found",
      });
    }

    const questionAttempts = await prisma.questionAttempt.findMany({
      where: {
        quizAttemptId: latestAttempt.id,
      },
      include: {
        question: {
          include: {
            options: true,
          },
        },
        option: true, // selected option
      },
      orderBy: {
        attemptedAt: "asc",
      },
    });

    const reviewData = questionAttempts.map((attempt) => {
      const correctOption = attempt.question.options.find(
        (option) => option.isCorrect,
      );

      return {
        questionId: attempt.question.id,
        questionText: attempt.question.questionText,

        yourAnswer: {
          id: attempt.option.id,
          text: attempt.option.optionText,
        },

        correctAnswer: {
          id: correctOption?.id,
          text: correctOption?.optionText,
        },

        isCorrect: attempt.isCorrect,

        explanation: attempt.question.explanation,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Quiz review fetched successfully",
      data: {
        attemptId: latestAttempt.id,
        quizId: latestAttempt.quiz.id,
        quizTitle: latestAttempt.quiz.title,

        score: latestAttempt.score,
        accuracy: latestAttempt.accuracy,
        timeTaken: latestAttempt.timeTaken,

        questions: reviewData,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export { startQuiz, finishQuiz, getQuizReview };
