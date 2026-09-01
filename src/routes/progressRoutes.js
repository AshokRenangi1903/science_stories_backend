import express from "express";
import {
  addStoryProgress,
  getProgress,
  updateStoryProgress,
} from "../controllers/progressController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.use(authMiddleware);

// Create Story Progress
router.post("/:storyId/addStoryProgress", addStoryProgress);

// Update story progress
router.put("/:storyId/updateStoryProgress", updateStoryProgress);

// Get the Progress
router.get("/getContinueReading", getProgress);

export default router;
