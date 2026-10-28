import jwt from "jsonwebtoken";

const generateToken = (userId, sessionVersion, res) => {
  const token = jwt.sign(
    {
      userId,
      sessionVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("ssjwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return token;
};

export { generateToken };
