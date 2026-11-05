import { prisma } from "../config/db.js";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";

const createAdminSession = async (adminId, sessionVersion) => {
  const { refreshToken, refreshTokenHash } = generateRefreshToken();

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: adminId,
      refreshTokenHash,
      sessionVersion,
      expiresAt,
    },
  });

  return refreshToken;
};

export { createAdminSession };
