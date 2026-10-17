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
    const extension = allowedTypes[file.mimetype];

    callback(null, `${crypto.randomUUID()}${extension}`);
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

      return next();
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
  const file = req.file;

  if (!file || !req.imageSha256) {
    await removeFile(file?.path);

    return res.status(400).json({
      status: "error",
      message: "Please upload a valid image first.",
    });
  }

  if (!baseUrl) {
    await removeFile(file.path);

    return res.status(500).json({
      status: "error",
      message: "Image URL configuration is missing.",
    });
  }

  try {
    // 1. Reuse an image when identical content already exists.
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

    // 2. Create the public URL for the newly uploaded image.
    const imageUrl = `${baseUrl}/uploads/${file.filename}`;

    // 3. Save metadata for the new managed image.
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
    // Another request may have registered identical content first.
    if (error.code === "P2002") {
      try {
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
      } catch (lookupError) {
        console.error("Could not retrieve duplicate image:", lookupError);
      }
    }

    // Remove the new file if its metadata could not be saved.
    await removeFile(file.path);

    console.error("Image upload failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Could not upload the image.",
    });
  }
};
