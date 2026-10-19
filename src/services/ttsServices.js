import "dotenv/config";
import textToSpeech from "@google-cloud/text-to-speech";

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

const client = new textToSpeech.TextToSpeechClient(
  credentialsPath ? { keyFilename: credentialsPath } : {},
);

const allowedVoices = new Set([
  "Algenib",
  "Algieba",
  "Charon",
  "Despina",
  "Erinome",
  "Gacrux",
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
    typeof voiceName !== "string" ||
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

  if (!response.audioContent?.length) {
    throw new Error("Google TTS returned empty audio");
  }

  return response.audioContent;
};

export { synthesizeSpeech };
