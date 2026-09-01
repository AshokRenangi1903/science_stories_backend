import express from "express";
import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
} from "../controllers/authControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/allowedRoles.js";
import { AdminRoles } from "../utils/roles.js";

const router = express.Router();

router.post("/adminLogin", adminLogin);
router.get("/me", authMiddleware, allowRoles(...AdminRoles), getCurrentAdmin);
router.post("/adminLogout", adminLogout);

export default router;
