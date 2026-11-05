import express from "express";

import {
  adminLogin,
  getCurrentAdmin,
  refreshAdminAccessToken,
  adminLogout,
} from "../controllers/adminAuthController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/allowedRoles.js";
import { AdminRoles } from "../utils/roles.js";

const router = express.Router();

router.post("/adminLogin", adminLogin);

router.post("/refresh", refreshAdminAccessToken);

router.get("/me", authMiddleware, allowRoles(...AdminRoles), getCurrentAdmin);

router.post("/adminLogout", adminLogout);

export default router;
