import express from "express";
import {
  receiveImage,
  uploadImage,
} from "../controllers/imageUploadController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/allowedRoles.js";
import { CreatorRoles } from "../utils/roles.js";

const router = express.Router();

router.post("/image", authMiddleware, receiveImage, uploadImage);

export default router;
