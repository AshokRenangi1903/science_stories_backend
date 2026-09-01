import express from "express";
import {
  createOption,
  deleteOption,
} from "../../controllers/quiz/optionController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import allowRoles from "../../middleware/allowedRoles.js";
import { CreatorRoles } from "../../utils/roles.js";

const router = express.Router();

router.use(authMiddleware, allowRoles(...CreatorRoles));

// Create an Option
router.post("/:questionId/createOption", createOption);

// Delete an Option
router.delete("/:id/deleteOption", deleteOption);

export default router;
