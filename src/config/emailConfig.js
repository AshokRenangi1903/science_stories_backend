import nodemailer from "nodemailer";
import "dotenv/config";
import { otpTemplate, welcomeTemplate } from "../utils/mailTemplates.js";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// sending mail to user
const sendOTPEmail = async (name, email, otp, title, subtitle) => {
  try {
    console.log("Sending mail to:", email);

    const info = await transporter.sendMail({
      from: `"Science Stories Team" <${process.env.SMTP_USER}>`, // sender address
      to: email, // list of recipients
      subject: title, // subject line
      text: "This is a message from Science Stories ", // plain text body
      html: otpTemplate(name, otp, title, subtitle),
    });
  } catch (error) {
    console.error("Error while sending mail:", error);
    throw error;
  }
};

// sending welcome mail to user
const sendWelcomeEmail = async (name, email) => {
  try {
    console.log("Sending mail to:", email);

    const info = await transporter.sendMail({
      from: `"Science Stories Team" <${process.env.SMTP_USER}>`, // sender address
      to: email, // list of recipients
      subject: "Welcome to Science Stories", // subject line
      text: "This is a message from Science Stories ", // plain text body
      html: welcomeTemplate(name),
    });
  } catch (error) {
    console.error("Error while sending mail:", error);
    throw error;
  }
};

export { sendOTPEmail, sendWelcomeEmail };
