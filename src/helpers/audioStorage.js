
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const AUDIO_DIR = path.resolve(
  process.env.AUDIO_STORAGE_DIR ||
    path.join(process.cwd(), "storage", "audio"),
);

function getAudioFileKey(sentenceId, languageCode, voiceName) {
  const key = `${sentenceId}\0${languageCode}\0${voiceName}`;

  return createHash("sha256")
    .update(key)
    .digest("hex");
}

async function saveSentenceAudio({
  sentenceId,
  languageCode,
  voiceName,
  audioContent,
}) {
  if (!sentenceId || !languageCode || !voiceName) {
    throw new Error("Sentence ID, language code, and voice name are required");
  }

  if (!audioContent || audioContent.length === 0) {
    throw new Error("Cannot save empty audio content");
  }

  await mkdir(AUDIO_DIR, { recursive: true });

  const fileKey = getAudioFileKey(
    sentenceId,
    languageCode,
    voiceName,
  );

  const filename = `${fileKey}.mp3`;
  const storagePath = path.join(AUDIO_DIR, filename);

  // Reuse an existing non-empty file.
  try {
    const existing = await stat(storagePath);

    if (existing.isFile() && existing.size > 0) {
      return {
        storagePath,
        audioUrl: `/audio/${filename}`,
        sizeBytes: existing.size,
        reused: true,
      };
    }

    await unlink(storagePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const audioBuffer = Buffer.from(audioContent);
  const temporaryPath = path.join(
    AUDIO_DIR,
    `${fileKey}.${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, audioBuffer, { flag: "wx" });
    await rename(temporaryPath, storagePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }

  return {
    storagePath,
    audioUrl: `/audio/${filename}`,
    sizeBytes: audioBuffer.length,
    reused: false,
  };
}

export { saveSentenceAudio };
