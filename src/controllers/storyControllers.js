import { prisma } from "../config/db.js";

// Creating a new Story in an Era
const createStory = async (req, res) => {
  try {
    const {
      title,
      description,
      scientistNames,
      imageUrl,
      position,
      isPopular,
      isPublished,
      discipline,
      subject,
      geolocation,
      estimatedReadTime,
    } = req.body;
    const era = await prisma.era.findUnique({
      where: {
        id: req.params.eraId,
      },
    });

    const lastStory = await prisma.story.findFirst({
      where: {
        eraId: req.params.eraId,
      },
      orderBy: {
        position: "desc",
      },
    });
    if (!era) {
      return res.status(404).json({
        status: "error",
        message: "Era not found",
      });
    }
    const story = await prisma.story.create({
      data: {
        title,
        description,
        scientistNames,
        imageUrl,
        position: lastStory ? lastStory.position + 1 : 1,
        isPopular,
        isPublished,
        discipline,
        subject,
        geolocation,
        estimatedReadTime,
        era: {
          connect: {
            id: req.params.eraId,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: "Created a new Story.",
      data: story,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Get all stories
const getAllStories = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      include: {
        era: {
          select: {
            id: true,
            title: true,
            position: true,
          },
        },
      },
      orderBy: [
        {
          era: {
            title: "asc",
          },
        },
        {
          position: "asc",
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: `Retrived the stories successfully`,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Get all stories from an Era
const getEraStories = async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: {
        eraId: req.params.eraId,
      },
      orderBy: { position: "asc" },
      include: {
        era: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: `Retrived the stories successfully`,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Get  a single  story
const getStory = async (req, res) => {
  try {
    const story = await prisma.story.findUnique({
      where: { id: req.params.storyId },
    });
    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "There is no such story available!",
      });
    }
    res.status(200).json({
      status: "success",
      message: `Retrived the ${story.title} story successfully`,
      data: story,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Updating a story
const updateStory = async (req, res) => {
  try {
    const {
      title,
      description,
      scientistNames,
      imageUrl,
      position,
      isPopular,
      isPublished,
      discipline,
      subject,
      geolocation,
      estimatedReadTime,
    } = req.body;

    const story = await prisma.story.findUnique({
      where: {
        id: req.params.storyId,
      },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "You cant update the story that is not available!",
      });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scientistNames !== undefined)
      updateData.scientistNames = scientistNames;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (position !== undefined) updateData.position = position;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (discipline !== undefined) updateData.discipline = discipline;
    if (subject !== undefined) updateData.subject = subject;
    if (geolocation !== undefined) updateData.geolocation = geolocation;
    if (estimatedReadTime !== undefined)
      updateData.estimatedReadTime = estimatedReadTime;

    const updatedStory = await prisma.story.update({
      where: { id: req.params.storyId },
      data: updateData,
    });

    res.status(200).json({
      status: "success",
      message: `Updated the ${updatedStory.title}  story Succesfully`,
      data: updatedStory,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Deleting a story
const deleteStory = async (req, res) => {
  try {
    const story = await prisma.story.findUnique({
      where: {
        id: req.params.storyId,
      },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "There is no such story to delete!",
      });
    }

    await prisma.story.delete({ where: { id: req.params.storyId } });

    res.status(200).json({
      status: "success",
      message: `Deleted story : ${story.title}`,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `Something went wrong ${error.message}`,
    });
  }
};

// Reorder Stories of an Era
const reorderStories = async (req, res) => {
  try {
    const { eraId } = req.params;
    const { storyIds } = req.body;

    // Validate eraId
    if (!eraId) {
      return res.status(400).json({
        success: false,
        message: "Era ID is required",
      });
    }

    // Validate storyIds
    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "storyIds must be a non-empty array",
      });
    }

    // Check whether all stories belong to this era
    const stories = await prisma.story.findMany({
      where: {
        id: {
          in: storyIds,
        },
        eraId: eraId,
      },
      select: {
        id: true,
      },
    });

    if (stories.length !== storyIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some stories do not belong to this era",
      });
    }

    // Update positions
    await prisma.$transaction(
      storyIds.map((storyId, index) =>
        prisma.story.update({
          where: {
            id: storyId,
          },
          data: {
            position: index + 1,
          },
        }),
      ),
    );

    return res.status(200).json({
      success: true,
      message: "Stories reordered successfully",
    });
  } catch (error) {
    console.error("Reorder stories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reorder stories",
      error: error.message,
    });
  }
};

export {
  createStory,
  getEraStories,
  getStory,
  updateStory,
  deleteStory,
  getAllStories,
  reorderStories,
};
