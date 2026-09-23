
import { Request, Response } from "express";

import {
  createScanCenter,
  deleteScanCenter,
  getScanCenterById,
  getScanCenters,
  updateScanCenter,
  getScanCentersByUserId
} from "../services/scan.service";

import { requireUserId } from "../utils/requireuser";

// =========================================================
// CREATE SCAN CENTER
// =========================================================

export async function createScanCenterController(
  req: Request,
  res: Response,
) {
  try {
    // Get scanCenterUserId from x-user-id header
    const userId = requireUserId(req);

    const {
      name,
      registrationNumber,
      phone,
      email,
      address,
      districtId,
      status,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "name is required",
      });
    }

    const scanCenter = await createScanCenter({
      scanCenterUserId: userId,
      name,
      registrationNumber,
      phone,
      email,
      address,
      districtId,
      status,
    });

    return res.status(201).json({
      status: "success",
      message: "Scan center created successfully",
      data: scanCenter,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// GET ALL SCAN CENTERS
// =========================================================

export async function getScanCentersController(
  req: Request,
  res: Response,
) {
  try {
    const scanCenters = await getScanCenters();

    return res.status(200).json({
      status: "success",
      data: scanCenters,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// GET SCAN CENTER BY ID
// =========================================================

export async function getScanCenterByIdController(
  req: Request<{ scanCenterId: string }>,
  res: Response,
) {
  try {
    const { scanCenterId } = req.params;

    const scanCenter =
      await getScanCenterById(scanCenterId);

    return res.status(200).json({
      status: "success",
      data: scanCenter,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// UPDATE SCAN CENTER
// =========================================================

export async function updateScanCenterController(
  req: Request<{ scanCenterId: string }>,
  res: Response,
) {
  try {
    const { scanCenterId } = req.params;

    const scanCenter =
      await updateScanCenter(
        scanCenterId,
        req.body,
      );

    return res.status(200).json({
      status: "success",
      message: "Scan center updated successfully",
      data: scanCenter,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// DELETE SCAN CENTER
// =========================================================

export async function deleteScanCenterController(
  req: Request<{ scanCenterId: string }>,
  res: Response,
) {
  try {
    const { scanCenterId } = req.params;

    await deleteScanCenter(scanCenterId);

    return res.status(200).json({
      status: "success",
      message: "Scan center deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}


// =========================================================
// GET SCAN CENTERS BY USER ID
// =========================================================

export async function getScanCentersByUserIdController(
  req: Request,
  res: Response,
) {
  try {
    const userId = requireUserId(req);

    const scanCenters = await getScanCentersByUserId(userId);

    return res.status(200).json({
      status: "success",
      data: scanCenters,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}


