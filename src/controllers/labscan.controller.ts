
import { Request, Response } from "express";

import { getLabScanByUserId } from "../services/labscan.service";
import { requireUserId } from "../utils/requireuser";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

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
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(data, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch lab and scan data",
    });
  }
}

