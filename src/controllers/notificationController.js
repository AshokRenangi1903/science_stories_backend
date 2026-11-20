import { prisma } from "../config/db.js";

// Register or update the current user's FCM token
const registerFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (
      typeof fcmToken !== "string" ||
      !fcmToken.trim() ||
      fcmToken.length > 4096
    ) {
      return res.status(400).json({
        status: "error",
        message: "A valid FCM token is required",
      });
    }

    const token = fcmToken.trim();

    await prisma.$transaction(async (tx) => {
      // Ensure this token is not assigned to another user.
      await tx.user.updateMany({
        where: {
          fcmToken: token,
          id: { not: req.user.id },
        },
        data: {
          fcmToken: null,
          fcmTokenUpdatedAt: null,
        },
      });

      // Assign the token to the authenticated user.
      await tx.user.update({
        where: { id: req.user.id },
        data: {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date(),
        },
      });
    });

    return res.status(200).json({
      status: "success",
      message: "FCM token registered successfully",
    });
  } catch (error) {
    console.error("registerFCMToken error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to register notification token",
    });
  }
};

// Remove the current user's FCM token
const removeFCMToken = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fcmToken: null,
        fcmTokenUpdatedAt: null,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "FCM token removed successfully",
    });
  } catch (error) {
    console.error("removeFCMToken error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to remove notification token",
    });
  }
};

export { registerFCMToken, removeFCMToken };
