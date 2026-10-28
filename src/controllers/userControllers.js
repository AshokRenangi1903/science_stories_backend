import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { sendOTPEmail, sendWelcomeEmail } from "../config/emailConfig.js";
import { generateOTP } from "../utils/generateOTP.js";

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

    // Remove only previous registration OTPs.
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
      // Don't leave a usable OTP if delivery failed.
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
// Creates the User only after successful verification.
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

    // Welcome email failure should not undo registration.
    try {
      await sendWelcomeEmail(user.name, user.email);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }

    const token = generateToken(user.id, user.sessionVersion, res);

    const { password: _password, ...safeUser } = user;

    return res.status(201).json({
      status: "success",
      message: "Registration completed successfully",
      token,
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

    // Incrementing this invalidates previously issued JWTs.
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        sessionVersion: { increment: 1 },
      },
    });

    const token = generateToken(user.id, user.sessionVersion, res);

    const { password: _password, ...safeUser } = user;

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
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

    // Avoid revealing whether an email is registered.
    if (!user) {
      return res.status(200).json({
        status: "success",
        message:
          "If this email is registered, a verification code will be sent",
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

    const user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
      },
    });

    await prisma.emailOTP.deleteMany({
      where: {
        email: normalizedEmail,
        purpose: "RESET_PASSWORD",
      },
    });

    // Clear the cookie in this browser.
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

    // Update name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          status: "error",
          message: "Name must be a non-empty string",
        });
      }

      data.name = name.trim();
    }

    // Update profile image URL
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

    // Update grade
    if (grade !== undefined) {
      if (grade !== null && (typeof grade !== "string" || !grade.trim())) {
        return res.status(400).json({
          status: "error",
          message: "Grade must be a non-empty string or null",
        });
      }

      data.grade = grade?.trim() ?? null;
    }

    // Update age
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
  getProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
  updateProfile,
};
