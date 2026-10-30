import { prisma } from "../config/db.js";
import crypto from "crypto";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { createUserSession } from "../services/sessionService.js";
import { sendOTPEmail, sendWelcomeEmail } from "../config/emailConfig.js";
import { generateOTP } from "../utils/generateOTP.js";
import { verifyGoogleIdToken } from "../services/googleAuthService.js";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8;

const isOTPValid = (otp) => /^\d{6}$/.test(String(otp));

const clearAuthCookie = (res) => {
  res.clearCookie("ssjwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};

// --------------------------------------------------
// REGISTER USER
// Sends OTP and stores pending registration details.
// A User record is NOT created at this stage.
// --------------------------------------------------

const registerUser = async (req, res) => {
  try {
    const { name, email, age } = req.body;

    const parsedAge = Number(age);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      age === undefined ||
      age === null ||
      !Number.isInteger(parsedAge) ||
      parsedAge < 5 ||
      parsedAge > 120
    ) {
      return res.status(400).json({
        status: "error",
        message: "Valid name, email and age are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "This email is already registered",
      });
    }

    await prisma.emailOTP.deleteMany({
      where: {
        email: normalizedEmail,
        purpose: "REGISTER",
      },
    });

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailOTP.create({
      data: {
        email: normalizedEmail,
        otp: hashedOTP,
        purpose: "REGISTER",
        name: name.trim(),
        age: parsedAge,
        expiresAt,
      },
    });

    try {
      await sendOTPEmail(
        name.trim(),
        normalizedEmail,
        otp,
        "Verify Your Email",
        "Complete your Science Stories registration",
      );
    } catch (emailError) {
      await prisma.emailOTP.deleteMany({
        where: {
          email: normalizedEmail,
          purpose: "REGISTER",
        },
      });

      throw emailError;
    }

    return res.status(200).json({
      status: "success",
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("registerUser error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to start registration right now",
    });
  }
};

// --------------------------------------------------
// VERIFY OTP
// Creates User and Session after successful verification.
// Request body: { email, otp, password }
// --------------------------------------------------

const verifyOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      !isOTPValid(otp) ||
      !isValidPassword(password)
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Valid email, six-digit OTP and password (at least 8 characters) are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "REGISTER",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification code",
      });
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await prisma.emailOTP.deleteMany({
        where: {
          email: normalizedEmail,
          purpose: "REGISTER",
        },
      });

      return res.status(400).json({
        status: "error",
        message: "Verification code expired. Please request another.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await prisma.emailOTP.deleteMany({
        where: {
          email: normalizedEmail,
          purpose: "REGISTER",
        },
      });

      return res.status(429).json({
        status: "error",
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const otpMatches = await bcrypt.compare(String(otp), otpRecord.otp);

    if (!otpMatches) {
      const updatedOTP = await prisma.emailOTP.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      if (updatedOTP.attempts >= 5) {
        await prisma.emailOTP.deleteMany({
          where: {
            email: normalizedEmail,
            purpose: "REGISTER",
          },
        });
      }

      return res.status(400).json({
        status: "error",
        message: "Invalid verification code",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await prisma.emailOTP.deleteMany({
        where: {
          email: normalizedEmail,
          purpose: "REGISTER",
        },
      });

      return res.status(409).json({
        status: "error",
        message: "This email is already registered",
      });
    }

    if (!otpRecord.name || otpRecord.age === null) {
      return res.status(400).json({
        status: "error",
        message: "Registration details are missing. Please register again.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the account only after OTP verification.
    const user = await prisma.user.create({
      data: {
        name: otpRecord.name,
        email: normalizedEmail,
        age: otpRecord.age,
        password: hashedPassword,
        isVerified: true,
      },
    });

    // Remove the used registration OTP.
    await prisma.emailOTP.deleteMany({
      where: {
        email: normalizedEmail,
        purpose: "REGISTER",
      },
    });

    // Create refresh-token session.
    const refreshToken = await createUserSession(user.id, user.sessionVersion);

    // Generate 15-minute access token.
    const token = generateToken(user.id, user.sessionVersion, res);

    // Welcome email failure should not undo registration.
    try {
      await sendWelcomeEmail(user.name, user.email);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }

    const { password: _password, ...safeUser } = user;

    return res.status(201).json({
      status: "success",
      message: "Registration completed successfully",
      token,
      refreshToken,
      data: safeUser,
    });
  } catch (error) {
    console.error("verifyOTP error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "This email is already registered",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Unable to verify your registration right now",
    });
  }
};

// --------------------------------------------------
// LOGIN USER
// A new login invalidates tokens from earlier sessions.
// --------------------------------------------------

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !existingUser ||
      !existingUser.password ||
      !existingUser.isVerified ||
      !existingUser.isActive
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Incrementing this invalidates previously issued access tokens.
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        sessionVersion: { increment: 1 },
      },
    });

    // Create a new refresh-token session.
    // Previous sessions are removed inside createUserSession.
    const refreshToken = await createUserSession(user.id, user.sessionVersion);

    // Generate 15-minute access token.
    const token = generateToken(user.id, user.sessionVersion, res);

    const { password: _password, ...safeUser } = user;

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      refreshToken,
      data: safeUser,
    });
  } catch (error) {
    console.error("loginUser error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to log in right now",
    });
  }
};

// --------------------------------------------------
// GOOGLE LOGIN
// Verifies Google identity and creates a normal app session.
// --------------------------------------------------

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (typeof idToken !== "string" || !idToken.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Google ID token is required",
      });
    }

    // Verify the token directly with Google.
    const googleUser = await verifyGoogleIdToken(idToken);

    // First check whether this Google account is already linked.
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      // Check whether an account with this verified email already exists.
      const existingUser = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (existingUser) {
        if (!existingUser.isVerified) {
          return res.status(403).json({
            status: "error",
            message: "Please verify your existing account first.",
          });
        }

        if (
          existingUser.role !== "STUDENT" &&
          existingUser.role !== "PREMIUM_STUDENT"
        ) {
          return res.status(403).json({
            status: "error",
            message: "Google login is available only for student accounts.",
          });
        }

        if (!existingUser.isActive) {
          return res.status(403).json({
            status: "error",
            message: "Your account is currently inactive.",
          });
        }

        // Link the verified Google identity to the existing account.
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: googleUser.googleId,
            profileImage: existingUser.profileImage || googleUser.profileImage,
          },
        });
      } else {
        // Create a new Google-based student account.
        user = await prisma.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            googleId: googleUser.googleId,
            profileImage: googleUser.profileImage,
            password: null,
            isVerified: true,
            role: "STUDENT",
          },
        });
      }
    }

    if (!user.isActive || !user.isVerified) {
      return res.status(403).json({
        status: "error",
        message: "Your account cannot currently sign in.",
      });
    }

    if (user.role !== "STUDENT" && user.role !== "PREMIUM_STUDENT") {
      return res.status(403).json({
        status: "error",
        message: "Google login is available only for student accounts.",
      });
    }

    // Latest login wins: invalidate previous sessions.
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionVersion: { increment: 1 },
      },
    });

    const refreshToken = await createUserSession(user.id, user.sessionVersion);

    const token = generateToken(user.id, user.sessionVersion, res);

    const { password: _password, ...safeUser } = user;

    return res.status(200).json({
      status: "success",
      message: "Google login successful",
      token,
      refreshToken,
      data: safeUser,
    });
  } catch (error) {
    console.error("googleLogin error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "This Google account or email is already linked.",
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Google authentication failed.",
    });
  }
};
// --------------------------------------------------
// REFRESH ACCESS TOKEN
// Validates and rotates the refresh token.
// Does not require authMiddleware.
// --------------------------------------------------

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Refresh token is required",
      });
    }

    // Hash the received refresh token to find its session.
    const oldTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const now = new Date();

    const session = await prisma.session.findUnique({
      where: {
        refreshTokenHash: oldTokenHash,
      },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.expiresAt <= now ||
      !session.user.isActive ||
      !session.user.isVerified ||
      session.sessionVersion !== session.user.sessionVersion
    ) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token is invalid or expired. Please log in again.",
      });
    }

    // Generate a new refresh token and its hash.
    const { refreshToken: newRefreshToken, refreshTokenHash: newTokenHash } =
      generateRefreshToken();

    // Sliding expiry: 30 days from this successful refresh.
    const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Atomically rotate the token.
    // Only one request using the old token can succeed.
    const rotation = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: session.userId },
      });

      if (
        !currentUser ||
        !currentUser.isActive ||
        !currentUser.isVerified ||
        currentUser.sessionVersion !== session.sessionVersion
      ) {
        return false;
      }

      const result = await tx.session.updateMany({
        where: {
          id: session.id,
          refreshTokenHash: oldTokenHash,
          sessionVersion: session.sessionVersion,
          expiresAt: { gt: now },
        },
        data: {
          refreshTokenHash: newTokenHash,
          lastUsedAt: now,
          expiresAt: newExpiresAt,
        },
      });

      return result.count === 1;
    });

    if (!rotation) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token is no longer valid. Please log in again.",
      });
    }

    // Issue a new 15-minute access token.
    const accessToken = generateToken(
      session.userId,
      session.sessionVersion,
      res,
    );

    return res.status(200).json({
      status: "success",
      message: "Token refreshed successfully",
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("refreshAccessToken error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to refresh session right now",
    });
  }
};

// --------------------------------------------------
// GET PROFILE
// Requires authMiddleware.
// --------------------------------------------------

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        grade: true,
        age: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error("getProfile error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to fetch profile right now",
    });
  }
};

// --------------------------------------------------
// FORGOT PASSWORD
// Creates a separate RESET_PASSWORD OTP.
// --------------------------------------------------

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "No account found with this email address",
      });
    }

    await prisma.emailOTP.deleteMany({
      where: {
        email: normalizedEmail,
        purpose: "RESET_PASSWORD",
      },
    });

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailOTP.create({
      data: {
        email: normalizedEmail,
        otp: hashedOTP,
        purpose: "RESET_PASSWORD",
        expiresAt,
      },
    });

    try {
      await sendOTPEmail(
        user.name,
        normalizedEmail,
        otp,
        "Reset Your Password",
        "Use this code to reset your Science Stories password",
      );
    } catch (emailError) {
      await prisma.emailOTP.deleteMany({
        where: {
          email: normalizedEmail,
          purpose: "RESET_PASSWORD",
        },
      });

      throw emailError;
    }

    return res.status(200).json({
      status: "success",
      message: "If this email is registered, a verification code will be sent",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to process the password-reset request right now",
    });
  }
};

// --------------------------------------------------
// RESET PASSWORD
// A successful reset invalidates existing sessions.
// --------------------------------------------------

const resetPassword = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      !isValidPassword(password) ||
      !isOTPValid(otp)
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Valid email, six-digit OTP and password (at least 8 characters) are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "RESET_PASSWORD",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification code",
      });
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await prisma.emailOTP.deleteMany({
        where: {
          email: normalizedEmail,
          purpose: "RESET_PASSWORD",
        },
      });

      return res.status(400).json({
        status: "error",
        message: "Verification code expired. Please request another.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await prisma.emailOTP.deleteMany({
        where: {
          email: normalizedEmail,
          purpose: "RESET_PASSWORD",
        },
      });

      return res.status(429).json({
        status: "error",
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const otpMatches = await bcrypt.compare(String(otp), otpRecord.otp);

    if (!otpMatches) {
      const updatedOTP = await prisma.emailOTP.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      if (updatedOTP.attempts >= 5) {
        await prisma.emailOTP.deleteMany({
          where: {
            email: normalizedEmail,
            purpose: "RESET_PASSWORD",
          },
        });
      }

      return res.status(400).json({
        status: "error",
        message: "Invalid verification code",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
      },
    });

    // Delete all refresh-token sessions for this user.
    await prisma.session.deleteMany({
      where: {
        user: {
          email: normalizedEmail,
        },
      },
    });

    await prisma.emailOTP.deleteMany({
      where: {
        email: normalizedEmail,
        purpose: "RESET_PASSWORD",
      },
    });

    clearAuthCookie(res);

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Unable to reset your password right now",
    });
  }
};

// --------------------------------------------------
// UPDATE PROFILE
// Requires authMiddleware.
// --------------------------------------------------

const updateProfile = async (req, res) => {
  try {
    const { name, profileImage, grade, age } = req.body;

    const data = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          status: "error",
          message: "Name must be a non-empty string",
        });
      }

      data.name = name.trim();
    }

    if (profileImage !== undefined) {
      if (
        profileImage !== null &&
        (typeof profileImage !== "string" || !profileImage.trim())
      ) {
        return res.status(400).json({
          status: "error",
          message: "Profile image URL must be a non-empty string or null",
        });
      }

      data.profileImage = profileImage?.trim() ?? null;
    }

    if (grade !== undefined) {
      if (grade !== null && (typeof grade !== "string" || !grade.trim())) {
        return res.status(400).json({
          status: "error",
          message: "Grade must be a non-empty string or null",
        });
      }

      data.grade = grade?.trim() ?? null;
    }

    if (age !== undefined) {
      if (age !== null) {
        const parsedAge =
          typeof age === "number"
            ? age
            : typeof age === "string" && age.trim() !== ""
              ? Number(age)
              : NaN;

        if (!Number.isInteger(parsedAge) || parsedAge < 5 || parsedAge > 120) {
          return res.status(400).json({
            status: "error",
            message: "Age must be a whole number between 5 and 120",
          });
        }

        data.age = parsedAge;
      } else {
        data.age = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid profile fields provided",
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        grade: true,
        age: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("updateProfile error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to update profile right now",
    });
  }
};

// --------------------------------------------------
// LOGOUT
// Requires authMiddleware.
// Invalidates the current session and clears its cookie.
// --------------------------------------------------

const logoutUser = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        sessionVersion: { increment: 1 },
      },
    });

    // Delete all refresh-token sessions for this user.
    await prisma.session.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    clearAuthCookie(res);

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("logoutUser error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to log out right now",
    });
  }
};

export {
  registerUser,
  verifyOTP,
  loginUser,
  refreshAccessToken,
  getProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
  updateProfile,
  googleLogin,
};
