import { prisma } from "../config/db.js";

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
        title: title,
        description: description,
        startYear: startYear,
        endYear: endYear,
        imageUrl: imageUrl,
        position: lastEra ? lastEra.position + 1 : 1,
        isPublished: isPublished,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Created a new Era",
      data: era,
    });
  } catch (error) {
    res.status(500).json({
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

    res.status(200).json({
      status: "success",
      message: "Retrived the eras",
      data: eras,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// To update the Era that exists already
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

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startYear !== undefined) updateData.startYear = startYear;
    if (endYear !== undefined) updateData.endYear = endYear;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    // Update era item
    const updatedEra = await prisma.era.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.status(200).json({
      status: "success",
      message: `Updated the ${updateData.title} Succesfully`,
      data: updatedEra,
    });
  } catch (error) {
    res.status(400).json({
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
    });

    if (!era) {
      return res.status(404).json({
        status: "error",
        message: "There is no such era to delete.",
      });
    }

    await prisma.era.delete({ where: { id: req.params.id } });

    res.json({
      status: "success",
      message: `Successfully deleted an era ${era.title}`,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `${error.message}`,
    });
  }
};

export { createEra, getAllEras, updateEra, deleteEra };
