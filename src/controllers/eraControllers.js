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

// To create a new Era
const createEra = async (req, res) => {
  try {
    const {
      title,
      description,
      startYear,
      endYear,
      imageUrl,
      position,
      isPublished,
    } = req.body;

    const lastEra = await prisma.era.findFirst({
      orderBy: {
        position: "desc",
      },
    });

    const era = await prisma.era.create({
      data: {
        title,
        description,
        startYear,
        endYear,
        imageUrl,
        position: lastEra ? lastEra.position + 1 : 1,
        isPublished,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Created a new Era",
      data: era,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// To get all the Eras
const getAllEras = async (req, res) => {
  try {
    const eras = await prisma.era.findMany({
      include: {
        _count: {
          select: {
            stories: true,
          },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Retrived the eras",
      data: eras,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// To update an existing Era
const updateEra = async (req, res) => {
  try {
    const { title, description, startYear, endYear, imageUrl, isPublished } =
      req.body;

    const era = await prisma.era.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!era) {
      return res.status(404).json({
        status: "error",
        message: "You cant update the era that is not available!",
      });
    }

    // Build update data so omitted fields remain unchanged.
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startYear !== undefined) updateData.startYear = startYear;
    if (endYear !== undefined) updateData.endYear = endYear;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedEra = await prisma.era.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Only consider the old image when its URL actually changed.
    // The helper checks whether another record still uses it.
    if (
      imageUrl !== undefined &&
      era.imageUrl &&
      era.imageUrl !== updatedEra.imageUrl
    ) {
      await cleanupImageIfUnused(era.imageUrl);
    }

    return res.status(200).json({
      status: "success",
      message: `Updated the ${updatedEra.title} Succesfully`,
      data: updatedEra,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

// To delete an Era
const deleteEra = async (req, res) => {
  try {
    const era = await prisma.era.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        stories: {
          include: {
            blocks: {
              select: {
                content: true,
              },
            },
          },
        },
      },
    });

    if (!era) {
      return res.status(404).json({
        status: "error",
        message: "There is no such era to delete.",
      });
    }

    // Collect candidate URLs BEFORE deleting the Era.
    // Deleting an Era may cascade-delete its Stories and StoryBlocks.
    const imageUrls = new Set();

    if (era.imageUrl) {
      imageUrls.add(era.imageUrl);
    }

    for (const story of era.stories) {
      if (story.imageUrl) {
        imageUrls.add(story.imageUrl);
      }

      for (const block of story.blocks) {
        for (const value of collectStrings(block.content)) {
          // Only URLs present in UploadedImage can actually be removed.
          // External/Cloudinary URLs will be ignored by the helper.
          if (value.startsWith("http://") || value.startsWith("https://")) {
            imageUrls.add(value);
          }
        }
      }
    }

    // Preserve the existing database deletion behavior.
    await prisma.era.delete({
      where: {
        id: req.params.id,
      },
    });

    // Check each candidate AFTER deletion.
    // Images still used elsewhere will be preserved.
    for (const imageUrl of imageUrls) {
      await cleanupImageIfUnused(imageUrl);
    }

    return res.json({
      status: "success",
      message: `Successfully deleted an era ${era.title}`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

export { createEra, getAllEras, updateEra, deleteEra };
