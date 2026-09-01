import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { sendOTPEmail, sendWelcomeEmail } from "../config/emailConfig.js";
import { generateOTP } from "../utils/generateOTP.js";

// User Registration
const registerUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: "error",
        message: "Name and email are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    await prisma.emailOTP.deleteMany({
      where: { email },
    });

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });
    
    await sendOTPEmail(
      name,
      email,
      otp,
      "Verify Your email",
      "Complete your Science Stories registration",
    );

    res.status(200).json({
      status: "success",
      message: "Sent a message to email",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// OTP Verification
const verifyOTP = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, password and OTP are required",
      });
    }

    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(404).json({
        status: "error",
        message: "OTP not found",
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailOTP.delete({
        where: {
          id: otpRecord.id,
        },
      });

      return res.status(400).json({
        status: "error",
        message: "OTP expired",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: true,
      },
    });

    const token = generateToken(user.id, res);

    await prisma.emailOTP.delete({
      where: {
        id: otpRecord.id,
      },
    });
    await sendWelcomeEmail(name, email);

    const { password: _, ...safeUser } = user;

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      token,
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// User Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: "error",
        message: "Account is disabled",
      });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        status: "error",
        message: "Please verify your email",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        status: "error",
        message: "Please login using Google",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id, res);

    const { password: _, ...safeUser } = user;

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    const { password: _, ...safeUser } = req.user;

    res.status(200).json({
      status: "success",
      message: "Got the User profile!",
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Forgot Password - sends OTP to the user
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "No user found with this Email!",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: "error",
        message: "Account is disabled",
      });
    }

    await prisma.emailOTP.deleteMany({
      where: { email },
    });

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    await sendOTPEmail(
      user.name,
      user.email,
      otp,
      "Reset Your Password",
      "Use this OTP to reset your account password",
    );

    res.status(200).json({
      status: "success",
      message: "OTP is sent to reset your password!",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({
        status: "error",
        message: " Email, password and OTP are required",
      });
    }

    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(404).json({
        status: "error",
        message: "OTP not found",
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailOTP.delete({
        where: {
          id: otpRecord.id,
        },
      });

      return res.status(400).json({
        status: "error",
        message: "OTP expired",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "User Not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.emailOTP.delete({
      where: {
        id: otpRecord.id,
      },
    });

    const { password: _, ...safeUser } = user;

    res.status(200).json({
      status: "success",
      message: "Password modified successfully!",

      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const { name, profileImage, grade } = req.body;

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (grade !== undefined) updateData.grade = grade;

    // Update watchlist item
    const updatedProfile = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    const { password: _, ...safeUser } = updatedProfile;

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// User Logout
const logoutUser = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "User Logged out successfully",
  });
};

export {
  registerUser,
  verifyOTP,
  loginUser,
  getProfile,
  resetPassword,
  forgotPassword,
  logoutUser,
  updateProfile,
};
