import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { prisma } from "./config/db.js";
import {
  startSentenceAudioWorker,
  stopSentenceAudioWorker,
} from "./services/sentenceAudioWorker.js";

// Existing routes
import eraRoutes from "./routes/eraRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardAnalyticsRoutes from "./routes/dashboardAnalyticsRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import storyBlockRoutes from "./routes/storyBlockroutes.js";
import quizRoutes from "./routes/quiz/quizRoutes.js";
import questionRoutes from "./routes/quiz/questionRoutes.js";
import optionRoutes from "./routes/quiz/optionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import quizAttemptRoutes from "./routes/quizAttempt/quizAttemptRoutes.js";
import questionAttemptRoutes from "./routes/quizAttempt/questionAttemptRoutes.js";
import ttsRoutes from "./routes/ttsRoutes.js";
import imageUploadRoutes from "./routes/imageUploadRoutes.js";

config();

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin === "https://science-stories.onrender.com" ||
        origin === "https://admin.sciencestories.in"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Preserve all existing API routes.
app.use("/api/tts", ttsRoutes);
app.use("/api/uploads", imageUploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboardAnalytics", dashboardAnalyticsRoutes);
app.use("/api/eras", eraRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/storyBlocks", storyBlockRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/quizAttempt", quizAttemptRoutes);
app.use("/api/questionAttempt", questionAttemptRoutes);

const PORT = Number(process.env.PORT) || 5001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);

  // Audio generation happens in the background.
  startSentenceAudioWorker().catch((error) => {
    console.error("Sentence audio worker stopped unexpectedly:", error);
  });
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  // Stop accepting new HTTP requests.
  server.close(async (error) => {
    if (error) {
      console.error("HTTP server shutdown error:", error);
    }

    try {
      await stopSentenceAudioWorker();
    } catch (workerError) {
      console.error("Worker shutdown error:", workerError);
    }

    try {
      await prisma.$disconnect();
    } catch (dbError) {
      console.error("Database disconnect error:", dbError);
    }

    process.exit(error ? 1 : 0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
