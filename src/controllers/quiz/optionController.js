import { prisma } from "../../config/db.js";

const createOption = async (req, res) => {
  try {
    const { optionText, isCorrect } = req.body;

    const question = await prisma.question.findUnique({
      where: {
        id: req.params.questionId,
      },
    });

    if (!question) {
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }

    const lastOption = await prisma.option.findFirst({
      where: {
        questionId: req.params.questionId,
      },
      orderBy: {
        position: "desc",
      },
    });

    // 🔥 IMPORTANT: ensure only ONE correct answer
    if (isCorrect === true) {
      await prisma.option.updateMany({
        where: {
          questionId: req.params.questionId,
        },
        data: {
          isCorrect: false,
        },
      });
    }

    const option = await prisma.option.create({
      data: {
        questionId: req.params.questionId,
        optionText,
        isCorrect: isCorrect ?? false,
        position: lastOption ? lastOption.position + 1 : 1,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Option created successfully",
      data: option,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const deleteOption = async (req, res) => {
  try {
    const option = await prisma.option.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!option) {
      return res.status(404).json({
        status: "error",
        message: "Option not found",
      });
    }

    await prisma.option.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Option deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export { createOption, deleteOption };
