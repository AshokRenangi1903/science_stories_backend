import firebaseApp from "../config/firebaseAdmin.js";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "../config/db.js";

const sendNotificationToUser = async ({ userId, title, body, data = {} }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      return { success: false, reason: "No FCM token registered" };
    }

    await getMessaging(firebaseApp).send({
      token: user.fcmToken,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)]),
      ),
    });

    return { success: true };
  } catch (error) {
    console.error("Notification sending failed:", error);

    // Remove tokens that Firebase confirms are invalid.
    if (
      error.code === "messaging/registration-token-not-registered" ||
      error.code === "messaging/invalid-registration-token"
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fcmToken: null,
          fcmTokenUpdatedAt: null,
        },
      });
    }

    return { success: false, reason: error.message };
  }
};

const sendNotificationToAllStudents = async ({ title, body, data = {} }) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: true,
        fcmToken: { not: null },
      },
      select: {
        fcmToken: true,
      },
    });

    const tokens = students.map((student) => student.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return {
        success: true,
        sent: 0,
        failed: 0,
        message: "No registered student devices found",
      };
    }

    let sent = 0;
    let failed = 0;
    const invalidTokens = [];

    // Firebase multicast supports up to 500 tokens per request.
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);

      const response = await getMessaging(firebaseApp).sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)]),
        ),
      });

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((result, index) => {
        if (
          !result.success &&
          [
            "messaging/registration-token-not-registered",
            "messaging/invalid-registration-token",
          ].includes(result.error?.code)
        ) {
          invalidTokens.push(batch[index]);
        }
      });
    }

    // Remove tokens Firebase has confirmed are invalid.
    if (invalidTokens.length > 0) {
      await prisma.user.updateMany({
        where: {
          fcmToken: { in: invalidTokens },
        },
        data: {
          fcmToken: null,
          fcmTokenUpdatedAt: null,
        },
      });
    }

    return { success: true, sent, failed };
  } catch (error) {
    console.error("Bulk notification sending failed:", error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      reason: error.message,
    };
  }
};

export { sendNotificationToAllStudents, sendNotificationToUser };
