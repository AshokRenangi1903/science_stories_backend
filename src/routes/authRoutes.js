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

// Admin login
router.post("/adminLogin", adminLogin);

// Refresh access token
router.post("/refresh", refreshAdminAccessToken);

// Get current admin
router.get("/me", authMiddleware, allowRoles(...AdminRoles), getCurrentAdmin);

// Admin logout
router.post("/adminLogout", adminLogout);

export default router;
