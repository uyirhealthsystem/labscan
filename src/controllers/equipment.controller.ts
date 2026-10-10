
import { Request, Response } from "express";

import {
  createEquipment,
  deleteEquipment,
  getEquipmentById,
  getEquipments,
  getEquipmentsByScanCenter,
  updateEquipment,
  createEquipmentService,
  deleteEquipmentService,
  getEquipmentServiceById,
  getEquipmentServices,
  getEquipmentServicesByEquipment,
  getEquipmentServicesByScanService,
} from "../services/equipment.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

export async function createEquipmentController(
  req: Request,
  res: Response,
) {
  try {
    const {
      scanCenterId,
      name,
      equipmentType,
      manufacturer,
      modelNumber,
      status,
    } = req.body;

    if (!scanCenterId || !name || !equipmentType) {
      return res.status(400).json({
        status: "error",
        message: "scanCenterId, name and equipmentType are required",
      });
    }

    const equipment = await createEquipment({
      scanCenterId,
      name,
      equipmentType,
      manufacturer,
      modelNumber,
      status,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Equipment created successfully",
      data: await translateResponse(equipment, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create equipment",
    });
  }
}

export async function getEquipmentsController(
  req: Request,
  res: Response,
) {
  try {
    const equipments = await getEquipments();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(equipments, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch equipment",
    });
  }
}

export async function getEquipmentsByScanCenterController(
  req: Request<{ scanCenterId: string }>,
  res: Response,
) {
  try {
    const { scanCenterId } = req.params;

    const equipments = await getEquipmentsByScanCenter(scanCenterId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(equipments, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch equipment for scan center",
    });
  }
}

export async function getEquipmentByIdController(
  req: Request<{ equipmentId: string }>,
  res: Response,
) {
  try {
    const { equipmentId } = req.params;

    const equipment = await getEquipmentById(equipmentId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(equipment, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Equipment not found",
    });
  }
}

export async function updateEquipmentController(
  req: Request<{ equipmentId: string }>,
  res: Response,
) {
  try {
    const { equipmentId } = req.params;

    const equipment = await updateEquipment(
      equipmentId,
      req.body,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Equipment updated successfully",
      data: await translateResponse(equipment, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update equipment",
    });
  }
}

export async function deleteEquipmentController(
  req: Request<{ equipmentId: string }>,
  res: Response,
) {
  try {
    const { equipmentId } = req.params;

    await deleteEquipment(equipmentId);

    return res.status(200).json({
      status: "success",
      message: "Equipment deleted successfully",
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete equipment",
    });
  }
}

export async function createEquipmentServiceController(
  req: Request,
  res: Response,
) {
  try {
    const { equipmentId, scanServiceId } = req.body;

    if (!equipmentId || !scanServiceId) {
      return res.status(400).json({
        status: "error",
        message: "equipmentId and scanServiceId are required",
      });
    }

    const equipmentService = await createEquipmentService({
      equipmentId,
      scanServiceId,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Equipment service mapping created successfully",
      data: await translateResponse(equipmentService, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create equipment service mapping",
    });
  }
}

export async function getEquipmentServicesController(
  req: Request,
  res: Response,
) {
  try {
    const equipmentServices = await getEquipmentServices();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(equipmentServices, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch equipment service mappings",
    });
  }
}

export async function getEquipmentServicesByEquipmentController(
  req: Request<{ equipmentId: string }>,
  res: Response,
) {
  try {
    const { equipmentId } = req.params;

    const equipmentServices =
      await getEquipmentServicesByEquipment(equipmentId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(equipmentServices, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch services for equipment",
    });
  }
}

export async function getEquipmentServicesByScanServiceController(
  req: Request<{ scanServiceId: string }>,
  res: Response,
) {
  try {
    const { scanServiceId } = req.params;

    const equipmentServices =
      await getEquipmentServicesByScanService(scanServiceId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(equipmentServices, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch equipment services for scan service",
    });
  }
}

export async function getEquipmentServiceByIdController(
  req: Request<{ equipmentServiceId: string }>,
  res: Response,
) {
  try {
    const { equipmentServiceId } = req.params;

    const equipmentService =
      await getEquipmentServiceById(equipmentServiceId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(equipmentService, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Equipment service mapping not found",
    });
  }
}

export async function deleteEquipmentServiceController(
  req: Request<{ equipmentServiceId: string }>,
  res: Response,
) {
  try {
    const { equipmentServiceId } = req.params;

    await deleteEquipmentService(equipmentServiceId);

    return res.status(200).json({
      status: "success",
      message: "Equipment service mapping deleted successfully",
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete equipment service mapping",
    });
  }
}

