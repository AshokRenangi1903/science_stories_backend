import { answerQuestion } from "../../controllers/quizAttempt/questionAttemptControllers.js";
import express from "express";

import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Answer a question
router.post("/:attemptId/answerQuestion", answerQuestion);

export default router;
