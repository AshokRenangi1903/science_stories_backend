import textToSpeech from "@google-cloud/text-to-speech";
import "dotenv/config";

// For production level
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: "/etc/secrets/google-tts-service-account.json",
});

// For local development
// const client = new textToSpeech.TextToSpeechClient({
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
// });

const allowedVoices = new Set([
  "Algenib",
  "Algieba",
  "Alnilam",
  "Charon",
  "Umbriel",
  "Despina",
  "Erinome",
  "Gacrux",
  "Vindemiatrix",
  "Zephyr",
]);

const synthesizeSpeech = async (
  text,
  voiceName = "en-US-Chirp3-HD-Charon",
  languageCode = "en-US",
) => {
  if (!["en-US", "en-IN"].includes(languageCode)) {
    const error = new Error("Unsupported language code");
    error.code = "INVALID_TTS_VOICE";
    throw error;
  }

  const prefix = `${languageCode}-Chirp3-HD-`;

  if (
    !voiceName.startsWith(prefix) ||
    !allowedVoices.has(voiceName.slice(prefix.length))
  ) {
    const error = new Error("Unsupported voice");
    error.code = "INVALID_TTS_VOICE";
    throw error;
  }

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  });

  return response.audioContent;
};

export { synthesizeSpeech };
