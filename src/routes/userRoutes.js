import express from "express";
import {
  registerUser,
  verifyOTP,
  loginUser,
  getProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
  updateProfile,
} from "../controllers/userControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// User Registration
router.post("/registerUser", registerUser);

// Verifying OTP
router.post("/verifyOTP", verifyOTP);

// Login User
router.post("/loginUser", loginUser);

// Forgot Password - Sends OTP to user
router.post("/forgotPassword", forgotPassword);

// Reset Password
router.put("/resetPassword", resetPassword);

// Me
router.get("/me", authMiddleware, getProfile);

// update profile
router.put("/updateProfile", authMiddleware, updateProfile);

// User logout
router.post("/logoutUser", logoutUser);

export default router;
