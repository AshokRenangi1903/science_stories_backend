import express from "express";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../controllers/quiz/questionController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import allowRoles from "../../middleware/allowedRoles.js";
import { CreatorRoles } from "../../utils/roles.js";

const router = express.Router();
router.use(authMiddleware, allowRoles(...CreatorRoles));

// Create a Quesiton
router.post("/:quizId/createQuestion", createQuestion);

router.put("/:id/updateQuestion", updateQuestion);

router.delete("/:id/deleteQuestion", deleteQuestion);

export default router;
