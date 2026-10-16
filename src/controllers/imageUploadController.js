import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { prisma } from "../config/db.js";

const uploadDirectory = path.resolve(process.env.IMAGE_UPLOAD_DIR || "uploads");

const baseUrl = process.env.PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${allowedTypes[file.mimetype]}`);
  },
});

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      return callback(
        new Error("Only JPEG, PNG, and WebP images are allowed."),
      );
    }

    callback(null, true);
  },
});

async function removeFile(filePath) {
  if (!filePath) return;

  await fs.promises.unlink(filePath).catch((error) => {
    if (error.code !== "ENOENT") {
      console.error("Image file cleanup failed:", error);
    }
  });
}

async function validateImageSignature(file) {
  const handle = await fs.promises.open(file.path, "r");

  try {
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buffer, 0, 12, 0);

    const isJpeg =
      bytesRead >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;

    const isPng =
      bytesRead >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    const isWebp =
      bytesRead >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";

    return (
      (file.mimetype === "image/jpeg" && isJpeg) ||
      (file.mimetype === "image/png" && isPng) ||
      (file.mimetype === "image/webp" && isWebp)
    );
  } finally {
    await handle.close();
  }
}

function calculateSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export const receiveImage = (req, res, next) => {
  multerUpload.single("image")(req, res, async (error) => {
    if (error) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";

      return res.status(400).json({
        status: "error",
        message: tooLarge ? "Image must be 5 MB or smaller." : error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Please select an image.",
      });
    }

    try {
      const validSignature = await validateImageSignature(req.file);

      if (!validSignature) {
        await removeFile(req.file.path);

        return res.status(400).json({
          status: "error",
          message: "The uploaded file is not a valid supported image.",
        });
      }

      req.imageSha256 = await calculateSha256(req.file.path);
      next();
    } catch (error) {
      await removeFile(req.file.path);

      console.error("Image validation failed:", error);

      return res.status(500).json({
        status: "error",
        message: "Could not validate the uploaded image.",
      });
    }
  });
};

export const uploadImage = async (req, res) => {
  if (!baseUrl) {
    await removeFile(req.file?.path);

    return res.status(500).json({
      status: "error",
      message: "Image URL configuration is missing.",
    });
  }

  const file = req.file;

  try {
    // 1. Check whether identical image content already exists.
    const existingImage = await prisma.uploadedImage.findUnique({
      where: { sha256: req.imageSha256 },
    });

    if (existingImage) {
      await removeFile(file.path);

      return res.status(200).json({
        status: "success",
        message: "Image already exists. Reusing the existing image.",
        data: {
          imageUrl: existingImage.imageUrl,
          filename: existingImage.filename,
          duplicate: true,
        },
      });
    }

    // 2. Save metadata for a new image.
    const imageUrl = `${baseUrl}/uploads/${file.filename}`;

    const uploadedImage = await prisma.uploadedImage.create({
      data: {
        sha256: req.imageSha256,
        filename: file.filename,
        imageUrl,
        sizeBytes: file.size,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Image uploaded successfully.",
      data: {
        imageUrl: uploadedImage.imageUrl,
        filename: uploadedImage.filename,
        duplicate: false,
      },
    });
  } catch (error) {
    // A concurrent request may have saved the same hash first.
    if (error.code === "P2002") {
      const existingImage = await prisma.uploadedImage.findUnique({
        where: { sha256: req.imageSha256 },
      });

      if (existingImage) {
        await removeFile(file.path);

        return res.status(200).json({
          status: "success",
          message: "Image already exists. Reusing the existing image.",
          data: {
            imageUrl: existingImage.imageUrl,
            filename: existingImage.filename,
            duplicate: true,
          },
        });
      }
    }

    // Don't leave a file behind if its metadata wasn't saved.
    await removeFile(file.path);

    console.error("Image upload failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Could not upload the image.",
    });
  }
};

// Recursively find image URLs inside StoryBlock JSON content.
function collectStrings(value, result = []) {
  if (typeof value === "string") {
    result.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, result);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, result);
    }
  }

  return result;
}

async function isImageInUse(imageUrl) {
  const [era, story, blocks] = await Promise.all([
    prisma.era.findFirst({
      where: { imageUrl },
      select: { id: true },
    }),

    prisma.story.findFirst({
      where: { imageUrl },
      select: { id: true },
    }),

    prisma.storyBlock.findMany({
      select: { content: true },
    }),
  ]);

  if (era || story) return true;

  return blocks.some((block) =>
    collectStrings(block.content).includes(imageUrl),
  );
}

// Call this AFTER deleting the related database record.
export async function cleanupImageIfUnused(imageUrl) {
  if (!imageUrl) return;

  const image = await prisma.uploadedImage.findUnique({
    where: { imageUrl },
  });

  // Only manage files registered in UploadedImage.
  if (!image) return;

  // Never remove an image still referenced elsewhere.
  if (await isImageInUse(image.imageUrl)) return;

  const safePath = path.resolve(uploadDirectory, image.filename);

  // Ensure the filename resolves directly inside our upload directory.
  if (path.dirname(safePath) !== uploadDirectory) {
    console.error("Refusing to delete an unsafe image path.");
    return;
  }

  // Delete the metadata only if file cleanup succeeded or file is already gone.
  try {
    await fs.promises.unlink(safePath).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });

    await prisma.uploadedImage.delete({
      where: { id: image.id },
    });
  } catch (error) {
    console.error("Unused image cleanup failed:", error);
  }
}
