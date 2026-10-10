
import { Request, Response } from "express";

import {
  createScanCenter,
  deleteScanCenter,
  getScanCentersByDistrict,
  getScanCenterById,
  getScanCenters,
  updateScanCenter,
  getScanCentersByUserId,
  getScanCenterMetricsByDistrict,
} from "../services/scan.service";

import { requireUserId } from "../utils/requireuser";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

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

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Scan center created successfully",
      data: await translateResponse(scanCenter, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create scan center",
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
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(scanCenters, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch scan centers",
    });
  }
}

// =========================================================
// GET SCAN CENTERS BY DISTRICT
// =========================================================

export async function getScanCentersByDistrictController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const districtId = req.params.districtId as string;

    if (!districtId) {
      res.status(400).json({
        status: "error",
        message: "districtId is required",
      });
      return;
    }

    const scanCenters = await getScanCentersByDistrict(districtId);
    const language = getRequestedLanguage(req);

    res.status(200).json({
      status: "success",
      districtId,
      data: await translateResponse(scanCenters, language),
    });
  } catch (error: unknown) {
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch scan centers by district",
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

    const scanCenter = await getScanCenterById(scanCenterId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(scanCenter, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Scan center not found",
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

    const scanCenter = await updateScanCenter(
      scanCenterId,
      req.body,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Scan center updated successfully",
      data: await translateResponse(scanCenter, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update scan center",
    });
  }
}

// =========================================================
// DELETE SCAN CENTER - SOFT DELETE
// =========================================================

export async function deleteScanCenterController(
  req: Request<{ scanCenterId: string }>,
  res: Response,
) {
  try {
    const { scanCenterId } = req.params;

    const scanCenter = await deleteScanCenter(scanCenterId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Scan center deactivated successfully",
      data: await translateResponse(
        {
          scanCenterId: scanCenter.scanCenterId,
          name: scanCenter.name,
          status: scanCenter.status,
        },
        language,
      ),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Scan center not found",
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
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(scanCenters, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch scan centers for user",
    });
  }
}

// =========================================================
// GET SCAN CENTER METRICS BY DISTRICT
// =========================================================

export async function getScanCenterMetricsByDistrictController(
  req: Request,
  res: Response,
) {
  try {
    const districtId = req.params.districtId as string;

    if (!districtId) {
      return res.status(400).json({
        status: "error",
        message: "districtId is required",
      });
    }

    const data = await getScanCenterMetricsByDistrict(districtId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      districtId,
      data: await translateResponse(data, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch scan center metrics",
    });
  }
}

