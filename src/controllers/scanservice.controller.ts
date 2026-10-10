
import { Request, Response } from "express";

import {
  createScanService,
  deleteScanService,
  getScanServiceById,
  getScanServices,
  updateScanService,
} from "../services/scanservice.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// CREATE SCAN SERVICE
// =========================================================

export async function createScanServiceController(
  req: Request,
  res: Response,
) {
  try {
    const {
      scanCenterId,
      serviceCatalogId,
      price,
      turnaroundTime,
      status,
    } = req.body;

    // Required field validation
    if (!scanCenterId) {
      return res.status(400).json({
        status: "error",
        message: "scanCenterId is required",
      });
    }

    if (!serviceCatalogId) {
      return res.status(400).json({
        status: "error",
        message: "serviceCatalogId is required",
      });
    }

    const scanService = await createScanService({
      scanCenterId,
      serviceCatalogId,
      price,
      turnaroundTime,
      status,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      data: await translateResponse(scanService, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create scan service",
    });
  }
}

// =========================================================
// GET ALL SERVICES FOR A SCAN CENTER
// =========================================================

export async function getScanServicesController(
  req: Request<{ scanCenterId: string }>,
  res: Response,
) {
  try {
    const { scanCenterId } = req.params;

    const scanServices = await getScanServices(scanCenterId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(scanServices, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch scan services",
    });
  }
}

// =========================================================
// GET SINGLE SCAN SERVICE
// =========================================================

export async function getScanServiceByIdController(
  req: Request<{
    scanCenterId: string;
    scanServiceId: string;
  }>,
  res: Response,
) {
  try {
    const {
      scanCenterId,
      scanServiceId,
    } = req.params;

    const scanService = await getScanServiceById(
      scanCenterId,
      scanServiceId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(scanService, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Scan service not found",
    });
  }
}

// =========================================================
// UPDATE SCAN SERVICE
// =========================================================

export async function updateScanServiceController(
  req: Request<{
    scanCenterId: string;
    scanServiceId: string;
  }>,
  res: Response,
) {
  try {
    const {
      scanCenterId,
      scanServiceId,
    } = req.params;

    const {
      price,
      turnaroundTime,
      status,
    } = req.body;

    const scanService = await updateScanService(
      scanCenterId,
      scanServiceId,
      {
        price,
        turnaroundTime,
        status,
      },
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(scanService, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update scan service",
    });
  }
}

// =========================================================
// DELETE SCAN SERVICE
// =========================================================

export async function deleteScanServiceController(
  req: Request<{
    scanCenterId: string;
    scanServiceId: string;
  }>,
  res: Response,
) {
  try {
    const {
      scanCenterId,
      scanServiceId,
    } = req.params;

    const scanService = await deleteScanService(
      scanCenterId,
      scanServiceId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(scanService, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete scan service",
    });
  }
}

