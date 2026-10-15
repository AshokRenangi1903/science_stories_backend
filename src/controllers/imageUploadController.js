import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

const uploadDirectory = process.env.IMAGE_UPLOAD_DIR || path.resolve("uploads");

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

export const receiveImage = (req, res, next) => {
  multerUpload.single("image")(req, res, async (error) => {
    if (error) {
      const isTooLarge = error.code === "LIMIT_FILE_SIZE";

      return res.status(400).json({
        status: "error",
        message: isTooLarge ? "Image must be 5 MB or smaller." : error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Please select an image.",
      });
    }

    let handle;

    try {
      handle = await fs.promises.open(req.file.path, "r");

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
          .equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          );

      const isWebp =
        bytesRead >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP";

      const validSignature =
        (req.file.mimetype === "image/jpeg" && isJpeg) ||
        (req.file.mimetype === "image/png" && isPng) ||
        (req.file.mimetype === "image/webp" && isWebp);

      if (!validSignature) {
        await handle.close();
        handle = null;
        await fs.promises.unlink(req.file.path).catch(() => {});

        return res.status(400).json({
          status: "error",
          message: "The uploaded file is not a valid supported image.",
        });
      }

      await handle.close();
      handle = null;

      next();
    } catch (validationError) {
      if (handle) await handle.close().catch(() => {});
      await fs.promises.unlink(req.file.path).catch(() => {});

      console.error("Image validation failed:", validationError);

      return res.status(500).json({
        status: "error",
        message: "Could not validate the uploaded image.",
      });
    }
  });
};

export const uploadImage = async (req, res) => {
  const baseUrl = process.env.PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    await fs.promises.unlink(req.file.path).catch(() => {});

    return res.status(500).json({
      status: "error",
      message: "Image URL configuration is missing.",
    });
  }

  const imageUrl = `${baseUrl.replace(/\/$/, "")}/uploads/${req.file.filename}`;

  return res.status(201).json({
    status: "success",
    message: "Image uploaded successfully.",
    data: {
      imageUrl,
      filename: req.file.filename,
    },
  });
};
