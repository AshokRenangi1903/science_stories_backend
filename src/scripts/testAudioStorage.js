import { readFile, stat } from "node:fs/promises";
import { saveSentenceAudio } from "../helpers/audioStorage.js";
import { synthesizeSpeech } from "../services/ttsServices.js";

const audioContent = await synthesizeSpeech(
  "Welcome to Science Stories.",
  "en-US-Chirp3-HD-Charon",
  "en-US",
);

const saved = await saveSentenceAudio({
  sentenceId: "local-storage-test-001",
  languageCode: "en-US",
  voiceName: "en-US-Chirp3-HD-Charon",
  audioContent,
});

const fileInfo = await stat(saved.storagePath);
const savedBytes = await readFile(saved.storagePath);

console.log("Audio URL:", saved.audioUrl);
console.log("File exists:", fileInfo.isFile());
console.log("Saved bytes:", savedBytes.length);
console.log("Reused existing file:", saved.reused);
