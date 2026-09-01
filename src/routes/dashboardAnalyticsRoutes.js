import express from "express";

import { getDashboardAnalytics } from "../controllers/dashboardAnalyticsController.js";

const router = express.Router();

// Get all analytics
router.get("/getDashboardAnalytics", getDashboardAnalytics);

export default router;
