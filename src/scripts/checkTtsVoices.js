
import { synthesizeSpeech } from "../services/ttsServices.js";

const voices = [
  "Algenib",
  "Algieba",
  "Charon",
  "Despina",
  "Erinome",
  "Gacrux",
];

const languages = ["en-US", "en-IN"];
const text = "Welcome to Science Stories.";

for (const languageCode of languages) {
  for (const voice of voices) {
    const voiceName = `${languageCode}-Chirp3-HD-${voice}`;

    try {
      const audio = await synthesizeSpeech(
        text,
        voiceName,
        languageCode,
      );

      console.log(
        `PASS | ${voiceName} | ${audio?.length ?? 0} bytes`,
      );
    } catch (error) {
      console.log(
        `FAIL | ${voiceName} | ${error.message}`,
      );
    }
  }
}
