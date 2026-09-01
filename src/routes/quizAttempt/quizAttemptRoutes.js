import {
  startQuiz,
  finishQuiz,
  getQuizReview,
} from "../../controllers/quizAttempt/quizAttemptControllers.js";

import express from "express";

import { authMiddleware } from "../../middleware/authMiddleware.js";
const router = express.Router();

router.use(authMiddleware);

// Create Start Quiz
router.post("/:quizId/startQuiz", startQuiz);

// Finish Quiz
router.post("/:attemptId/finishQuiz", finishQuiz);

// Review Quiz
router.get("/:storyId/reviewQuiz", getQuizReview);

export default router;
