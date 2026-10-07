import textToSpeech from "@google-cloud/text-to-speech";

const client = new textToSpeech.TextToSpeechClient();

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
