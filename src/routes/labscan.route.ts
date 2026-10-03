
import { Router } from "express";

import {
  getLabScanByUserIdController,
} from "../controllers/labscan.controller";

const router = Router();

// =========================================================
// GET LAB + SCAN DATA FOR LOGGED-IN PRO / USER
// =========================================================

router.get(
  "/user",
  getLabScanByUserIdController,
);

export default router;

