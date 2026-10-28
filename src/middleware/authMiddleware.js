import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.ssjwt ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (
      !user ||
      !user.isActive ||
      !user.isVerified ||
      user.sessionVersion !== decoded.sessionVersion
    ) {
      return res.status(401).json({
        status: "error",
        message: "Session expired. Please log in again.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired session",
    });
  }
};

export { authMiddleware };
