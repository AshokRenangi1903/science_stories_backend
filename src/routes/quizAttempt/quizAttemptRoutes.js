import express from "express";

import { authMiddleware } from "../../middleware/authMiddleware.js";

import {
  getStudentQuiz,
  revealAnswer,
  submitQuiz,
  getQuizReview,
  getQuizAttemptHistory,
  getQuizAttemptReview,
} from "../../controllers/quizAttempt/quizAttemptControllers.js";

const router = express.Router();

router.use(authMiddleware);

// Fetch student quiz using story ID
router.get("/:storyId/studentQuiz", getStudentQuiz);

// Fetch all completed attempts for a story
router.get("/:storyId/attemptHistory", getQuizAttemptHistory);

// Fetch review of a particular attempt
router.get("/attempt/:attemptId/review", getQuizAttemptReview);

// Reveal answer without saving an attempt
router.post("/:quizId/revealAnswer", revealAnswer);

// Submit the complete quiz
router.post("/:quizId/submitQuiz", submitQuiz);

// Existing latest completed attempt review
router.get("/:storyId/reviewQuiz", getQuizReview);

export default router;
