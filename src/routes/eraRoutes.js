import express from "express";

import {
  createEra,
  getAllEras,
  updateEra,
  deleteEra,
} from "../controllers/eraControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/allowedRoles.js";
import { CreatorRoles } from "../utils/roles.js";

const router = express.Router();
// get all Eras
router.get("/getEras", getAllEras);

// Middleware for Authorization
router.use(authMiddleware, allowRoles(...CreatorRoles));

// Creating new Era
router.post("/createEra", createEra);

// Updating an era
router.put("/updateEra/:id", updateEra);

// Deleting the existing era
router.delete("/deleteEra/:id", deleteEra);

export default router;
