
import { Request, Response } from "express";

import {
  createScanServiceCatalog,
  deleteScanServiceCatalog,
  getScanServiceCatalogById,
  getScanServiceCatalogs,
  updateScanServiceCatalog,
} from "../services/scancatalog.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// CREATE SCAN SERVICE CATALOG
// =========================================================

export async function createScanServiceCatalogController(
  req: Request,
  res: Response,
) {
  try {
    const {
      code,
      name,
      description,
      category,
      status,
    } = req.body;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "code is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "name is required",
      });
    }

    const catalog = await createScanServiceCatalog({
      code,
      name,
      description,
      category,
      status,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      data: await translateResponse(catalog, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create scan service catalog",
    });
  }
}

// =========================================================
// GET ALL SCAN SERVICE CATALOGS
// =========================================================

export async function getScanServiceCatalogsController(
  req: Request,
  res: Response,
) {
  try {
    const catalogs = await getScanServiceCatalogs();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(catalogs, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch scan service catalogs",
    });
  }
}

// =========================================================
// GET SCAN SERVICE CATALOG BY ID
// =========================================================

export async function getScanServiceCatalogByIdController(
  req: Request<{ serviceCatalogId: string }>,
  res: Response,
) {
  try {
    const catalog = await getScanServiceCatalogById(
      req.params.serviceCatalogId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(catalog, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Scan service catalog not found",
    });
  }
}

// =========================================================
// UPDATE SCAN SERVICE CATALOG
// =========================================================

export async function updateScanServiceCatalogController(
  req: Request<{ serviceCatalogId: string }>,
  res: Response,
) {
  try {
    const catalog = await updateScanServiceCatalog(
      req.params.serviceCatalogId,
      req.body,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(catalog, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update scan service catalog",
    });
  }
}

// =========================================================
// DELETE SCAN SERVICE CATALOG
// =========================================================

export async function deleteScanServiceCatalogController(
  req: Request<{ serviceCatalogId: string }>,
  res: Response,
) {
  try {
    const catalog = await deleteScanServiceCatalog(
      req.params.serviceCatalogId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(catalog, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete scan service catalog",
    });
  }
}

