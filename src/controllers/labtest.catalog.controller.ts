
import { Request, Response } from "express";

import {
  createLabTestCatalog,
  deleteLabTestCatalog,
  getLabTestCatalogById,
  getLabTestCatalogs,
  updateLabTestCatalog,
} from "../services/labtest.catalog.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// CREATE LAB TEST CATALOG
export async function createLabTestCatalogController(
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
      fastingRequirement,
      fastingHours,
      preparationInstructions,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        status: "error",
        message: "code and name are required",
      });
    }

    const catalog = await createLabTestCatalog({
      code,
      name,
      description,
      category,
      status,
      fastingRequirement,
      fastingHours,
      preparationInstructions,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Lab test catalog created successfully",
      data: await translateResponse(catalog, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET ALL LAB TEST CATALOGS
export async function getLabTestCatalogsController(
  req: Request,
  res: Response,
) {
  try {
    const catalogs = await getLabTestCatalogs();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(catalogs, language),
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET LAB TEST CATALOG BY ID
export async function getLabTestCatalogByIdController(
  req: Request<{ testCatalogId: string }>,
  res: Response,
) {
  try {
    const { testCatalogId } = req.params;
    const language = getRequestedLanguage(req);

    const catalog = await getLabTestCatalogById(testCatalogId);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(catalog, language),
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// UPDATE LAB TEST CATALOG
export async function updateLabTestCatalogController(
  req: Request<{ testCatalogId: string }>,
  res: Response,
) {
  try {
    const { testCatalogId } = req.params;

    const {
      code,
      name,
      description,
      category,
      status,
      fastingRequirement,
      fastingHours,
      preparationInstructions,
    } = req.body;

    const catalog = await updateLabTestCatalog(testCatalogId, {
      code,
      name,
      description,
      category,
      status,
      fastingRequirement,
      fastingHours,
      preparationInstructions,
    });

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Lab test catalog updated successfully",
      data: await translateResponse(catalog, language),
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// DELETE LAB TEST CATALOG
export async function deleteLabTestCatalogController(
  req: Request<{ testCatalogId: string }>,
  res: Response,
) {
  try {
    const { testCatalogId } = req.params;

    await deleteLabTestCatalog(testCatalogId);

    return res.status(200).json({
      status: "success",
      message: "Lab test catalog deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}