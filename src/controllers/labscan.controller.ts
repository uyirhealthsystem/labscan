
import { Request, Response } from "express";

import { getLabScanByUserId } from "../services/labscan.service";
import { requireUserId } from "../utils/requireuser";

// =========================================================
// GET LAB + SCAN DATA FOR LOGGED-IN USER / PRO
// =========================================================

export async function getLabScanByUserIdController(
  req: Request,
  res: Response,
) {
  try {
    // Get PRO/User ID from x-user-id header
    const userId = requireUserId(req);

    const data = await getLabScanByUserId(userId);

    return res.status(200).json({
      status: "success",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

