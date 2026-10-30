import crypto from "crypto";

const generateRefreshToken = () => {
  const refreshToken = crypto.randomBytes(64).toString("hex");

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  return {
    refreshToken,
    refreshTokenHash,
  };
};

export { generateRefreshToken };