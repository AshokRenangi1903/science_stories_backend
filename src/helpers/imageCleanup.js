import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/db.js";

const uploadDirectory = path.resolve(process.env.IMAGE_UPLOAD_DIR || "uploads");

/**
 * Collect all strings from nested JSON content.
 * This supports IMAGE, SCIENTIST_CARD and future block formats.
 */
function collectStrings(value, result = []) {
  if (typeof value === "string") {
    result.push(value);
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, result);
    }
    return result;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, result);
    }
  }

  return result;
}

/**
 * Check whether an image URL is referenced anywhere
 * in the application's current database content.
 */
export async function isImageInUse(imageUrl) {
  if (!imageUrl) return false;

  const [era, story, user, blocks] = await Promise.all([
    prisma.era.findFirst({
      where: { imageUrl },
      select: { id: true },
    }),

    prisma.story.findFirst({
      where: { imageUrl },
      select: { id: true },
    }),

    prisma.user.findFirst({
      where: { profileImage: imageUrl },
      select: { id: true },
    }),

    prisma.storyBlock.findMany({
      select: { content: true },
    }),
  ]);

  if (era || story || user) {
    return true;
  }

  return blocks.some((block) =>
    collectStrings(block.content).includes(imageUrl),
  );
}

/**
 * Delete an image only if:
 * 1. It is registered in UploadedImage.
 * 2. It is inside the configured local upload directory.
 * 3. No database record references its URL.
 *
 * External images such as Cloudinary URLs are not managed here.
 */
export async function cleanupImageIfUnused(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return;
  }

  try {
    // Find only images managed by this application's upload system.
    // imageUrl is not unique in the current schema, so use findFirst.
    const image = await prisma.uploadedImage.findFirst({
      where: { imageUrl },
    });

    if (!image) {
      // Not managed by UploadedImage: do not delete anything.
      return;
    }

    // Check current references immediately before deletion.
    if (await isImageInUse(image.imageUrl)) {
      return;
    }

    const safePath = path.resolve(uploadDirectory, image.filename);

    // Prevent path traversal or deletion outside the upload directory.
    if (path.dirname(safePath) !== uploadDirectory) {
      console.error(
        `[ImageCleanup] Refusing unsafe path for image ${image.id}`,
      );
      return;
    }

    // Remove the file first. If this fails, retain its DB metadata
    // so cleanup can be investigated or retried.
    try {
      await fs.promises.unlink(safePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // The file is already absent; remove stale metadata below.
    }

    await prisma.uploadedImage.delete({
      where: { id: image.id },
    });

    console.info(`[ImageCleanup] Removed unused image: ${image.filename}`);
  } catch (error) {
    // Cleanup failure must not undo an already-successful story/era update.
    console.error(`[ImageCleanup] Failed for URL ${imageUrl}:`, error.message);
  }
}
