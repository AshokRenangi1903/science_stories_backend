import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/allowedRoles.js";
import {
  createStory,
  deleteStory,
  getEraStories,
  getStory,
  getAllStories,
  updateStory,
  reorderStories,
} from "../controllers/storyControllers.js";
import { CreatorRoles } from "../utils/roles.js";

const router = express.Router();

// Get all stories from an Era
router.get("/:eraId/getEraStories", getEraStories);

// Get all stories
router.get("/getAllStories", getAllStories);

// Get a single story
router.get("/:storyId/getStory", getStory);

// authMiddleware , role-based Access ---------------------------------------
router.use(authMiddleware, allowRoles(...CreatorRoles));

// Create a new story
router.post("/:eraId/createStory", createStory);

// Updating a story in an Era
router.put("/:storyId/updateStory", updateStory);

// delete a story
router.delete("/:storyId/deleteStory", deleteStory);

// reorder stories
router.patch("/:eraId/reorderStories", reorderStories);

export default router;
