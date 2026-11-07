import express from "express";

import {
  createQuiz,
  deleteQuiz,
  updateQuiz,
  getQuiz,
  getQuizzes,
} from "../../controllers/quiz/quizController.js";

import { authMiddleware } from "../../middleware/authMiddleware.js";
import allowRoles from "../../middleware/allowedRoles.js";
import { CreatorRoles } from "../../utils/roles.js";

const router = express.Router();

// All quiz management routes require creator/admin access
router.use(authMiddleware, allowRoles(...CreatorRoles));

// Get quiz of a story
router.get("/:quizId/getQuiz", getQuiz);

// Get all quizzes
router.get("/getQuizzes", getQuizzes);

// Create a quiz
router.post("/:storyId/createQuiz", createQuiz);

// Update a quiz
router.put("/:id/updateQuiz", updateQuiz);

// Delete a quiz
router.delete("/:id/deleteQuiz", deleteQuiz);

export default router;
