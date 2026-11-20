import express from "express";

import {
  registerFCMToken,
  removeFCMToken,
} from "../controllers/notificationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register or update the logged-in user's FCM token
router.post("/registerFCMToken", authMiddleware, registerFCMToken);

// Remove the logged-in user's FCM token
router.delete("/removeFCMToken", authMiddleware, removeFCMToken);

router.post("/test", authMiddleware, sendTestNotification);

export default router;
