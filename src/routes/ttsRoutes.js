import express from "express";
import { chunkTTS } from "../controllers/ttsController.js";

const router = express.Router();

router.post("/chunks", chunkTTS);

export default router;
