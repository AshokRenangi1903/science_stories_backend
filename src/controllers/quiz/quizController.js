import { prisma } from "../../config/db.js";
// Get all quizzes
const getQuizzes = async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        story: {
          select: {
            title: true,
            era: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: `Retrived all the quizzes successfully`,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Get quiz of a story
const getQuiz = async (req, res) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: req.params.quizId,
      },
      include: {
        questions: {
          orderBy: {
            position: "asc",
          },
          include: {
            options: {
              orderBy: {
                position: "asc",
              },
            },
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

    res.status(200).json({
      status: "success",
      message: `Retrived the quiz successfully`,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// create a quiz
const createQuiz = async (req, res) => {
  try {
    const { title, timeLimit } = req.body;

    // check quiz exists
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        storyId: req.params.storyId,
      },
    });

    if (existingQuiz) {
      return res.status(400).json({
        status: "error",
        message: "Quiz already exists for this story",
      });
    }

    const story = await prisma.story.findUnique({
      where: {
        id: req.params.storyId,
      },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "Story not found! Can't create Quiz!",
      });
    }

    const quiz = await prisma.quiz.create({
      data: {
        storyId: req.params.storyId,
        title,
        timeLimit: timeLimit ?? 10,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Created a new Quiz.",
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// updating quiz
const updateQuiz = async (req, res) => {
  try {
    const { title, timeLimit, updatedAt } = req.body;

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!quiz) {
      return res.status(404).json({
        status: "error",
        message: "You cant update the quiz that is not available!",
      });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;

    updateData.updatedAt = new Date();

    const updatedQuiz = await prisma.quiz.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.status(200).json({
      status: "success",
      message: `Updated the ${updatedQuiz.title} quiz Succesfully`,
      data: updatedQuiz,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// delete a quiz
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!quiz) {
      return res.status(404).json({
        status: "error",
        message: "No such quiz found to delete!",
      });
    }

    await prisma.quiz.delete({ where: { id: req.params.id } });

    res.status(200).json({
      status: "success",
      message: "Quiz deleted Successfully!",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

export { createQuiz, deleteQuiz, updateQuiz, getQuiz, getQuizzes };
