import { prisma } from "../../config/db.js";

const answerQuestion = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionId } = req.body;

    if (!attemptId || !questionId || !selectedOptionId) {
      return res.status(400).json({
        status: "error",
        message: "attemptId, questionId and selectedOptionId are required",
      });
    }

    // Check quiz attempt
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        quiz: true,
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

    // Check question
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }

    // Check selected option belongs to question
    const selectedOption = question.options.find(
      (option) => option.id === selectedOptionId,
    );

    if (!selectedOption) {
      return res.status(400).json({
        status: "error",
        message: "Invalid option selected",
      });
    }

    // Prevent duplicate answer
    const existingAnswer = await prisma.questionAttempt.findUnique({
      where: {
        quizAttemptId_questionId: {
          quizAttemptId: attemptId,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      return res.status(400).json({
        status: "error",
        message: "Question already answered",
      });
    }

    // Find correct option
    const correctOption = question.options.find((option) => option.isCorrect);

    if (!correctOption) {
      return res.status(500).json({
        status: "error",
        message: "No correct option configured for this question",
      });
    }

    const isCorrect = correctOption.id === selectedOptionId;

    // Save answer
    const questionAttempt = await prisma.questionAttempt.create({
      data: {
        quizAttemptId: attemptId,
        questionId,
        selectedOptionId,
        isCorrect,
      },
    });

    // Get all answers for this attempt
    const allAnswers = await prisma.questionAttempt.findMany({
      where: {
        quizAttemptId: attemptId,
      },
    });

    const answeredCount = allAnswers.length;

    const correctCount = allAnswers.filter((answer) => answer.isCorrect).length;

    // Calculate score
    const score = correctCount * quizAttempt.quiz.marksPerQuestion;

    // Calculate accuracy
    const accuracy =
      answeredCount > 0
        ? Number(((correctCount / answeredCount) * 100).toFixed(2))
        : 0;

    // Update quiz attempt stats
    await prisma.quizAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        score,
        accuracy,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Answer submitted successfully",
      data: {
        questionAttemptId: questionAttempt.id,

        isCorrect,

        selectedOptionId,
        correctOptionId: correctOption.id,

        explanation: question.explanation,

        currentScore: score,
        currentAccuracy: accuracy,

        answeredQuestions: answeredCount,
        correctAnswers: correctCount,

        totalQuestions: quizAttempt.totalQuestions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export { answerQuestion };
