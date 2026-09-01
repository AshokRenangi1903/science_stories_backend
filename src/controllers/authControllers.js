import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

// Admin Login Function
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // check if admin email exists in the table
  const admin = await prisma.user.findUnique({
    where: { email: email.trim() },
  });

  if (!admin) {
    return res.status(401).json({ error: "Invalid email or password !" });
  }

  // Check whether Admin or not
  const isAdmin = admin.role == "ADMIN";
  if (!isAdmin) {
    return res.status(401).json({ error: "Not an Admin !" });
  }

  // Verify Password
  const isPasswordValid = await bcrypt.compare(password, admin.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      error: "Invalid  email or password !",
    });
  }

  // Generate JWT token
  const token = generateToken(admin.id, res);

  // Login Success
  res.status(200).json({
    status: "success",
    message: "Admin logged in successfully!",
    // userId: req.user.id, // we can get the id by using the token
    data: {
      admin, // admin table
    },
    token,
  });
};

// Get Current Admin
const getCurrentAdmin = async (req, res) => {
  console.log("COOKIE:", req.cookies.ssjwt);

  res.status(200).json({
    success: true,
    message: "Cookie received",
  });
};

// Admin Logout Function
const adminLogout = async (req, res) => {
  res.cookie("ssjwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(201).json({
    status: "success",
    message: "Admin Logged Out Successfully!!!",
  });
};

export { adminLogin, adminLogout, getCurrentAdmin };
