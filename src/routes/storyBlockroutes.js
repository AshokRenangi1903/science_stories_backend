import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/allowedRoles.js";
import {
  createStoryBlock,
  deleteStoryBlock,
  getStoryBlocks,
  updateStoryBlock,
  reorderStoryBlocks,
} from "../controllers/storyBlockControllers.js";
import { CreatorRoles } from "../utils/roles.js";

const router = express.Router();

// Get all story-blocks of a story
router.get("/:storyId/getStoryBlocks", getStoryBlocks);

// authMiddleware , role-based Access ---------------------------------------
router.use(authMiddleware, allowRoles(...CreatorRoles));

// Create a story block
router.post("/:storyId/createStoryBlock", createStoryBlock);

// update a story block
router.put("/:id/updateStoryBlock", updateStoryBlock);

// delete a story block
router.delete("/:id/deleteStoryBlock", deleteStoryBlock);

// reorder blocks
router.patch("/:storyId/reorderStoryBlocks", reorderStoryBlocks);

export default router;
