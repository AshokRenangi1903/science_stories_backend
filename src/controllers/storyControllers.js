import { prisma } from "../config/db.js";
import { cleanupImageIfUnused } from "../helpers/imageCleanup.js";

// Collect strings from nested StoryBlock JSON content.
function collectStrings(value, result = []) {
  if (typeof value === "string") {
    result.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, result);
    }
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, result);
    }
  }

  return result;
}

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

    if (!era) {
      return res.status(404).json({
        status: "error",
        message: "Era not found",
      });
    }

    const lastStory = await prisma.story.findFirst({
      where: {
        eraId: req.params.eraId,
      },
      orderBy: {
        position: "desc",
      },
    });

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

    return res.status(200).json({
      status: "success",
      message: "Created a new Story.",
      data: story,
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      status: "success",
      message: "Retrived the stories successfully",
      data: stories,
    });
  } catch (error) {
    return res.status(500).json({
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
      orderBy: {
        position: "asc",
      },
      include: {
        era: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Retrived the stories successfully",
      data: stories,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Get a single Story
const getStory = async (req, res) => {
  try {
    const story = await prisma.story.findUnique({
      where: {
        id: req.params.storyId,
      },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "There is no such story available!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Retrived the ${story.title} story successfully`,
      data: story,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// Updating a Story
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

    // Build update data; omitted fields remain unchanged.
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scientistNames !== undefined) {
      updateData.scientistNames = scientistNames;
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (position !== undefined) updateData.position = position;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (discipline !== undefined) updateData.discipline = discipline;
    if (subject !== undefined) updateData.subject = subject;
    if (geolocation !== undefined) updateData.geolocation = geolocation;
    if (estimatedReadTime !== undefined) {
      updateData.estimatedReadTime = estimatedReadTime;
    }

    const updatedStory = await prisma.story.update({
      where: {
        id: req.params.storyId,
      },
      data: updateData,
    });

    // Check the old image only if its URL changed.
    if (
      imageUrl !== undefined &&
      story.imageUrl &&
      story.imageUrl !== updatedStory.imageUrl
    ) {
      await cleanupImageIfUnused(story.imageUrl);
    }

    return res.status(200).json({
      status: "success",
      message: `Updated the ${updatedStory.title}  story Succesfully`,
      data: updatedStory,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Deleting a Story
const deleteStory = async (req, res) => {
  try {
    // Fetch the Story and its blocks before deletion because
    // related StoryBlocks may be cascade-deleted.
    const story = await prisma.story.findUnique({
      where: {
        id: req.params.storyId,
      },
      include: {
        blocks: {
          select: {
            content: true,
          },
        },
      },
    });

    if (!story) {
      return res.status(404).json({
        status: "error",
        message: "There is no such story to delete!",
      });
    }

    // Collect candidate image URLs before deleting database records.
    const imageUrls = new Set();

    if (story.imageUrl) {
      imageUrls.add(story.imageUrl);
    }

    for (const block of story.blocks) {
      for (const value of collectStrings(block.content)) {
        if (value.startsWith("http://") || value.startsWith("https://")) {
          imageUrls.add(value);
        }
      }
    }

    // Preserve the existing Story deletion operation.
    await prisma.story.delete({
      where: {
        id: req.params.storyId,
      },
    });

    // Cleanup runs only after the Story deletion succeeds.
    // The helper checks whether each image is still referenced.
    for (const imageUrl of imageUrls) {
      await cleanupImageIfUnused(imageUrl);
    }

    return res.status(200).json({
      status: "success",
      message: `Deleted story : ${story.title}`,
    });
  } catch (error) {
    return res.status(500).json({
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

    if (!eraId) {
      return res.status(400).json({
        success: false,
        message: "Era ID is required",
      });
    }

    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "storyIds must be a non-empty array",
      });
    }

    // Reject duplicate IDs as well as IDs outside this Era.
    if (new Set(storyIds).size !== storyIds.length) {
      return res.status(400).json({
        success: false,
        message: "storyIds must not contain duplicates",
      });
    }

    const stories = await prisma.story.findMany({
      where: {
        id: {
          in: storyIds,
        },
        eraId,
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
