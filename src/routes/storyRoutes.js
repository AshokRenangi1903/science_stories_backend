import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/allowedRoles.js";
import {
  createStory,
  deleteStory,
  getEraStories,
  getStory,
  getAllStories,
  getPublishedStories,
  updateStory,
  getAllScientists,
  reorderStories,
} from "../controllers/storyControllers.js";
import { CreatorRoles } from "../utils/roles.js";

const router = express.Router();

// Public routes
router.get("/getScientists", getAllScientists);

// Get published stories for students
router.get("/getPublishedStories", authMiddleware, getPublishedStories);

// Get stories from an era
router.get("/:eraId/getEraStories", authMiddleware, getEraStories);

// Get a single story
router.get("/:storyId/getStory", getStory);

// Admin and Editor routes
router.use(authMiddleware, allowRoles(...CreatorRoles));

// Get all stories (Admin / Editor only)
router.get("/getAllStories", getAllStories);

// Create a new story
router.post("/:eraId/createStory", createStory);

// Update a story
router.put("/:storyId/updateStory", updateStory);

// Delete a story
router.delete("/:storyId/deleteStory", deleteStory);

// Reorder stories
router.patch("/:eraId/reorderStories", reorderStories);

export default router;
