import { synthesizeSpeech } from "../services/ttsServices.js";

const chunkTTS = async (req, res) => {
  try {
    const {
      text,
      voiceName = "en-US-Chirp3-HD-Charon",
      languageCode = "en-US",
    } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Text is required",
      });
    }

    const audioContent = await synthesizeSpeech(text, voiceName, languageCode);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioContent.length,
      "Cache-Control": "no-store",
    });

    return res.send(audioContent);
  } catch (error) {
    if (error.code === "INVALID_TTS_VOICE") {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("Chunk TTS Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Audio generation failed",
    });
  }
};

export { chunkTTS };
