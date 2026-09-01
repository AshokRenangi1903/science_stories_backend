import { disconnectDB, prisma } from "../../config/db.js";

const createQuestion = async (req, res) => {
  try {
    const { questionText, explanation, category, difficulty, options } =
      req.body;

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: req.params.quizId,
      },
    });

    if (!quiz) {
      return res.status(404).json({
        status: "error",
        message: "Can't create any questions without Quiz!",
      });
    }

    const lastQuestion = await prisma.question.findFirst({
      where: {
        quizId: req.params.quizId,
      },
      orderBy: {
        position: "desc",
      },
    });

    // Must have 4 options only
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        status: "error",
        message: "A question must have exactly 4 options.",
      });
    }

    // Check whether question has exactly one correct answer or not
    const correctCount = options.filter(
      (option) => option.isCorrect === true,
    ).length;

    if (correctCount !== 1) {
      return res.status(400).json({
        status: "error",
        message: "A question must have exactly one correct option.",
      });
    }

    const question = await prisma.question.create({
      data: {
        quizId: req.params.quizId,
        questionText,
        explanation,
        category,
        difficulty,
        position: lastQuestion ? lastQuestion.position + 1 : 1,
        options: {
          create: options.map((option, index) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect ?? false,
            position: index + 1,
          })),
        },
      },
      include: {
        options: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      message: "Question and options are created successfully!",
      data: question,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// updating Quesion
const updateQuestion = async (req, res) => {
  try {
    const { questionText, explanation, difficulty, category, options } =
      req.body;

    // 1. Check question exists
    const question = await prisma.question.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "You can't update a question that is not available!",
      });
    }

    // 2. Validate exactly 4 options
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        status: "error",
        message: "A question must have exactly 4 options.",
      });
    }

    // 3. Validate exactly one correct option
    const correctCount = options.filter(
      (option) => option.isCorrect === true,
    ).length;

    if (correctCount !== 1) {
      return res.status(400).json({
        status: "error",
        message: "A question must have exactly one correct option.",
      });
    }

    // 4. Update everything in one transaction
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // Update question
      const updated = await tx.question.update({
        where: {
          id: req.params.id,
        },
        data: {
          ...(questionText !== undefined && { questionText }),
          ...(explanation !== undefined && { explanation }),
          ...(difficulty !== undefined && { difficulty }),
          ...(category !== undefined && { category }),
        },
      });

      // Update all 4 existing options
      for (const option of options) {
        await tx.option.update({
          where: {
            id: option.id,
          },
          data: {
            optionText: option.optionText,
            isCorrect: option.isCorrect,
          },
        });
      }

      return tx.question.findUnique({
        where: {
          id: updated.id,
        },
        include: {
          options: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });
    });

    res.status(200).json({
      status: "success",
      message: "Question and options updated successfully!",
      data: updatedQuestion,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// To delete an Question
const deleteQuestion = async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "There is no such question to delete.",
      });
    }

    await prisma.question.delete({ where: { id: req.params.id } });

    res.status(200).json({
      status: "success",
      message: `Successfully deleted a question`,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};
export { createQuestion, updateQuestion, deleteQuestion };
