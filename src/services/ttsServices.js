import textToSpeech from "@google-cloud/text-to-speech";

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: "/etc/secrets/google-tts-service-account.json",
});
const synthesizeSpeech = async (text) => {
  const [response] = await client.synthesizeSpeech({
    input: {
      text,
    },

    voice: {
      languageCode: "en-US",
      name: "en-US-Chirp3-HD-Charon",
    },

    audioConfig: {
      audioEncoding: "MP3",
    },
  });

  return response.audioContent;
};

export { synthesizeSpeech };
// testing github
