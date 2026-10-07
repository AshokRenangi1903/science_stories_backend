import { synthesizeSpeech } from "../services/ttsServices.js";

const chunkTTS = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Text is required",
      });
    }

    const audioContent = await synthesizeSpeech(text);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioContent.length,
      "Cache-Control": "public, max-age=31536000",
    });

    res.send(audioContent);
  } catch (error) {
    console.error("Chunk TTS Error:", error);

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export { chunkTTS };
