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

    return res.status(201).json({
      status: "success",
      message: "Equipment created successfully",
      data: equipment,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getEquipmentsController(
  req: Request,
  res: Response,
) {
  try {
    const equipments = await getEquipments();

    return res.status(200).json({
      status: "success",
      data: equipments,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
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

    return res.status(200).json({
      status: "success",
      data: equipments,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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

    return res.status(200).json({
      status: "success",
      data: equipment,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
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

    return res.status(200).json({
      status: "success",
      message: "Equipment updated successfully",
      data: equipment,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
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

    return res.status(201).json({
      status: "success",
      message: "Equipment service mapping created successfully",
      data: equipmentService,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getEquipmentServicesController(
  req: Request,
  res: Response,
) {
  try {
    const equipmentServices = await getEquipmentServices();

    return res.status(200).json({
      status: "success",
      data: equipmentServices,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
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

    return res.status(200).json({
      status: "success",
      data: equipmentServices,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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

    return res.status(200).json({
      status: "success",
      data: equipmentServices,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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

    return res.status(200).json({
      status: "success",
      data: equipmentService,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
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
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}