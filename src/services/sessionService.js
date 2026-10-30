import { prisma } from "../config/db.js";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";

const createUserSession = async (userId, sessionVersion) => {
  const { refreshToken, refreshTokenHash } = generateRefreshToken();

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    // Enforce one active session per user.
    await tx.session.deleteMany({
      where: { userId },
    });

    await tx.session.create({
      data: {
        userId,
        refreshTokenHash,
        sessionVersion,
        expiresAt,
      },
    });
  });

  return refreshToken;
};

export { createUserSession };
