import { prisma } from "../../config/db.js";

// 1. Fetch quiz for a student
const getStudentQuiz = async (req, res) => {
  try {
    const { storyId } = req.params;

    if (!storyId) {
      return res.status(400).json({
        status: "error",
        message: "Story ID is required",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        storyId,
        story: {
          isPublished: true,
        },
      },
      select: {
        id: true,
        storyId: true,
        title: true,
        timeLimit: true,
        marksPerQuestion: true,
        questions: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            questionText: true,
            category: true,
            difficulty: true,
            position: true,
            options: {
              orderBy: {
                position: "asc",
              },
              select: {
                id: true,
                optionText: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        status: "error",
        message: "Quiz not found for this story",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Quiz fetched successfully",
      data: quiz,
    });
  } catch (error) {
    console.error("Get student quiz error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to fetch quiz",
    });
  }
};

// 2. Reveal answer without saving an attempt
const revealAnswer = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionId, selectedOptionId } = req.body;

    if (!questionId || !selectedOptionId) {
      return res.status(400).json({
        status: "error",
        message: "Question ID and selected option ID are required",
      });
    }

    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        quizId,
      },
      include: {
        options: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found in this quiz",
      });
    }

    const selectedOption = question.options.find(
      (option) => option.id === selectedOptionId,
    );

    if (!selectedOption) {
      return res.status(400).json({
        status: "error",
        message: "Invalid option selected",
      });
    }

    const correctOption = question.options.find(
      (option) => option.isCorrect,
    );

    if (!correctOption) {
      return res.status(500).json({
        status: "error",
        message: "No correct option configured",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Answer revealed successfully",
      data: {
        questionId,
        selectedOptionId,
        isCorrect: selectedOption.id === correctOption.id,
        correctOption: {
          id: correctOption.id,
          text: correctOption.optionText,
        },
        explanation: question.explanation,
      },
    });
  } catch (error) {
    console.error("Reveal answer error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to reveal answer",
    });
  }
};

// 3. Submit the entire quiz
const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const { answers, timeTaken } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Answers are required",
      });
    }

    if (
      !Number.isInteger(timeTaken) ||
      timeTaken < 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Valid time taken is required",
      });
    }

    // Fetch quiz and its questions
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        story: {
          isPublished: true,
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        status: "error",
        message: "Quiz not found",
      });
    }

    const questions = quiz.questions;

    // Every question must be answered
    if (answers.length !== questions.length) {
      return res.status(400).json({
        status: "error",
        message: "Please answer every question before submitting",
      });
    }

    // Reject duplicate question answers
    const submittedQuestionIds = answers.map(
      (answer) => answer.questionId,
    );

    if (
      new Set(submittedQuestionIds).size !==
      submittedQuestionIds.length
    ) {
      return res.status(400).json({
        status: "error",
        message: "Duplicate question answers are not allowed",
      });
    }

    const questionMap = new Map(
      questions.map((question) => [
        question.id,
        question,
      ]),
    );

    let correctCount = 0;

    const validatedAnswers = [];

    for (const answer of answers) {
      const { questionId, selectedOptionId } = answer;

      if (!questionId || !selectedOptionId) {
        return res.status(400).json({
          status: "error",
          message: "Every question must have a selected option",
        });
      }

      const question = questionMap.get(questionId);

      if (!question) {
        return res.status(400).json({
          status: "error",
          message: "Invalid question submitted",
        });
      }

      const selectedOption = question.options.find(
        (option) => option.id === selectedOptionId,
      );

      if (!selectedOption) {
        return res.status(400).json({
          status: "error",
          message: "Selected option does not belong to its question",
        });
      }

      const correctOption = question.options.find(
        (option) => option.isCorrect,
      );

      if (!correctOption) {
        return res.status(500).json({
          status: "error",
          message: "A question has no correct option configured",
        });
      }

      const isCorrect = selectedOption.id === correctOption.id;

      if (isCorrect) {
        correctCount++;
      }

      validatedAnswers.push({
        questionId,
        selectedOptionId,
        isCorrect,
      });
    }

    // Calculate final result on the backend
    const totalQuestions = questions.length;
    const score = correctCount * quiz.marksPerQuestion;

    const accuracy = Number(
      ((correctCount / totalQuestions) * 100).toFixed(2),
    );

    const completedAt = new Date();

    const startedAt = new Date(
      completedAt.getTime() - timeTaken * 1000,
    );

    // Save attempt, question attempts and progress atomically
    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          quizId,
          score,
          totalQuestions,
          accuracy,
          timeTaken,
          status: "COMPLETED",
          startedAt,
          completedAt,

          questionAttempts: {
            create: validatedAnswers,
          },
        },
      });

      // Any fully submitted quiz completes the story
      await tx.storyProgress.upsert({
        where: {
          userId_storyId: {
            userId,
            storyId: quiz.storyId,
          },
        },
        update: {
          quizCompleted: true,
          storyCompleted: true,
          completedAt,
        },
        create: {
          userId,
          storyId: quiz.storyId,
          quizCompleted: true,
          storyCompleted: true,
          completedAt,
        },
      });

      return attempt;
    });

    return res.status(201).json({
      status: "success",
      message: "Quiz submitted successfully",
      data: {
        attemptId: result.id,
        quizId,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
        accuracy,
        timeTaken,
        completedAt,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to submit quiz",
    });
  }
};

// 4. Get latest completed quiz review
const getQuizReview = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    const latestAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        status: "COMPLETED",
        quiz: {
          storyId,
        },
      },
      orderBy: [
        {
          completedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
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
            options: {
              orderBy: {
                position: "asc",
              },
            },
          },
        },
        option: true,
      },
      orderBy: {
        attemptedAt: "asc",
      },
    });

    const reviewQuestions = questionAttempts.map((attempt) => {
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

        correctAnswer: correctOption
          ? {
              id: correctOption.id,
              text: correctOption.optionText,
            }
          : null,

        isCorrect: attempt.isCorrect,
        explanation: attempt.question.explanation,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Latest quiz review fetched successfully",
      data: {
        attemptId: latestAttempt.id,
        quizId: latestAttempt.quiz.id,
        quizTitle: latestAttempt.quiz.title,
        score: latestAttempt.score,
        totalQuestions: latestAttempt.totalQuestions,
        accuracy: latestAttempt.accuracy,
        timeTaken: latestAttempt.timeTaken,
        completedAt: latestAttempt.completedAt,
        questions: reviewQuestions,
      },
    });
  } catch (error) {
    console.error("Get quiz review error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to fetch quiz review",
    });
  }
};

export {
  getStudentQuiz,
  revealAnswer,
  submitQuiz,
  getQuizReview,
};