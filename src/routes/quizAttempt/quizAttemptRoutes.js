import express from "express";

import { authMiddleware } from "../../middleware/authMiddleware.js";

import allowRoles from "./../../middleware/allowedRoles.js";
import {
  getStudentQuiz,
  revealAnswer,
  submitQuiz,
  getQuizReview,
} from "../../controllers/quizAttempt/quizAttemptControllers.js";

const router = express.Router();

router.use(authMiddleware, allowRoles(...StudentRoles));
// Fetch student quiz using story ID
router.get("/:storyId/studentQuiz", getStudentQuiz);

// Reveal answer without saving an attempt
router.post("/:quizId/revealAnswer", revealAnswer);

// Submit the complete quiz
router.post("/:quizId/submitQuiz", submitQuiz);

// Fetch latest completed attempt
router.get("/:storyId/reviewQuiz", getQuizReview);

export default router;
