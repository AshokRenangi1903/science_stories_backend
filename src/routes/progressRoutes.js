import express from "express";
import {
  addStoryProgress,
  getProgress,
  getMyProgress,
  updateStoryProgress,
} from "../controllers/progressController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.use(authMiddleware);

// Create Story Progress
router.post("/:storyId/addStoryProgress", addStoryProgress);

// Complete student progress for My Progress page
router.get("/myProgress", getMyProgress);

// Update story progress
router.put("/:storyId/updateStoryProgress", updateStoryProgress);

// Get the Progress
router.get("/getContinueReading", getProgress);

export default router;
