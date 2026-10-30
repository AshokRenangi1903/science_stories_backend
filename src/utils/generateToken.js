import jwt from "jsonwebtoken";

const generateToken = (userId, sessionVersion, res) => {
  const accessToken = jwt.sign(
    {
      userId,
      sessionVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  // Keep the cookie for web clients.
  res.cookie("ssjwt", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  return accessToken;
};

export { generateToken };
