import { prisma } from "../config/db.js";
import jwt from "jsonwebtoken";

// Read token from the request
// Check if token is valid or not
export const authMiddleware = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; //["Bearer","fjdakkjfda==token"]
  } else if (req.cookies?.ssjwt) {
    token = req.cookies.ssjwt;
  }

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Not Authorized, No token is provided",
    });
  }

  try {
    // verify token and extract the userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User no longer exists !!!",
      });
    }

    

    req.user = user;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Session expired. Please login again.",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Authentication failed.",
    });
  }
};
