  import express, { urlencoded } from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// Importing routes
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

config();
const app = express();

// Body parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
  if (
    !origin ||
    origin.startsWith("http://localhost:") ||
    origin === "https://science-stories.onrender.com"
  ) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
},
    credentials: true,
  }),
);

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

const server = app.listen(process.env.PORT, () => {
  console.log(`Sever listening on port ${process.env.PORT}`);
});
