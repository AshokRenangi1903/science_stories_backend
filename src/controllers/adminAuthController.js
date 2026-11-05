import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { generateToken } from "../utils/generateToken.js";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";
import { createAdminSession } from "../utils/createAdminSession.js";

const REFRESH_COOKIE = "ssrefresh";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("ssjwt", cookieOptions);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
};

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required.",
      });
    }

    const admin = await prisma.user.findUnique({
      where: { email },
    });

    if (
      !admin ||
      admin.role !== "ADMIN" ||
      !admin.isActive ||
      !admin.isVerified
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid admin credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid admin credentials.",
      });
    }

    // Create a separate session without deleting other devices' sessions.
    const refreshToken = await createAdminSession(
      admin.id,
      admin.sessionVersion,
    );

    // Sets the 15-minute ssjwt HttpOnly cookie.
    generateToken(admin.id, admin.sessionVersion, res);

    // Sets the 7-day ssrefresh HttpOnly cookie.
    setRefreshCookie(res, refreshToken);

    const safeAdmin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      profileImage: admin.profileImage,
      role: admin.role,
      isActive: admin.isActive,
      isVerified: admin.isVerified,
    };

    return res.status(200).json({
      status: "success",
      message: "Admin logged in successfully!",
      data: { admin: safeAdmin },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong during admin login.",
    });
  }
};

// Get Current Admin
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!admin || admin.role !== "ADMIN") {
      return res.status(401).json({
        status: "error",
        message: "Admin not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Admin authenticated successfully.",
      data: { admin },
    });
  } catch (error) {
    console.error("Get current admin error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to fetch admin details.",
    });
  }
};

// Refresh Admin Access Token
const refreshAdminAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh session not found. Please log in again.",
      });
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.expiresAt <= new Date() ||
      session.user.role !== "ADMIN" ||
      !session.user.isActive ||
      !session.user.isVerified ||
      session.sessionVersion !== session.user.sessionVersion
    ) {
      clearAuthCookies(res);

      return res.status(401).json({
        status: "error",
        message: "Invalid or expired admin session.",
      });
    }

    const {
      refreshToken: newRefreshToken,
      refreshTokenHash: newRefreshTokenHash,
    } = generateRefreshToken();

    const newExpiresAt = new Date(Date.now() + REFRESH_MAX_AGE);

    // Atomically rotate only this browser's refresh session.2
    const rotated = await prisma.$transaction(async (tx) => {
      const currentAdmin = await tx.user.findUnique({
        where: { id: session.userId },
      });

      if (
        !currentAdmin ||
        currentAdmin.role !== "ADMIN" ||
        !currentAdmin.isActive ||
        !currentAdmin.isVerified ||
        currentAdmin.sessionVersion !== session.sessionVersion
      ) {
        return false;
      }

      const result = await tx.session.updateMany({
        where: {
          id: session.id,
          refreshTokenHash,
          sessionVersion: session.sessionVersion,
          expiresAt: { gt: new Date() },
        },
        data: {
          refreshTokenHash: newRefreshTokenHash,
          lastUsedAt: new Date(),
          expiresAt: newExpiresAt,
        },
      });

      return result.count === 1;
    });

    if (!rotated) {
      clearAuthCookies(res);

      return res.status(401).json({
        status: "error",
        message: "Admin session expired. Please log in again.",
      });
    }

    // Issue a new 15-minute access cookie.
    generateToken(session.userId, session.sessionVersion, res);

    // Replace the old 7-day refresh cookie.
    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      status: "success",
      message: "Admin session refreshed successfully.",
    });
  } catch (error) {
    console.error("Admin refresh error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to refresh admin session.",
    });
  }
};

// Admin Logout
const adminLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (refreshToken) {
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      // Revoke only this browser's session.
      await prisma.session.deleteMany({
        where: { refreshTokenHash },
      });
    }

    clearAuthCookies(res);

    return res.status(200).json({
      status: "success",
      message: "Admin logged out successfully.",
    });
  } catch (error) {
    console.error("Admin logout error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to log out admin.",
    });
  }
};

export { adminLogin, getCurrentAdmin, refreshAdminAccessToken, adminLogout };
