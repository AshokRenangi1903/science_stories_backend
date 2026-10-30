import express from "express";
import {
  registerUser,
  verifyOTP,
  loginUser,
  refreshAccessToken,
  getProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
  updateProfile,
} from "../controllers/userControllers.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  registerLimiter,
  verifyOTPLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/registerUser", registerLimiter, registerUser);
router.post("/verifyOTP", verifyOTPLimiter, verifyOTP);
router.post("/loginUser", loginUser);

// Public route protected by its own refresh-token validation.
router.post("/refreshToken", refreshAccessToken);

router.post("/forgotPassword", forgotPasswordLimiter, forgotPassword);
router.put("/resetPassword", resetPasswordLimiter, resetPassword);

router.get("/me", authMiddleware, getProfile);
router.put("/updateProfile", authMiddleware, updateProfile);
router.post("/logoutUser", authMiddleware, logoutUser);

export default router;
