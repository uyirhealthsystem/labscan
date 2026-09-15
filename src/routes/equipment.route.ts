import { Router } from "express";

import {
  createEquipmentController,
  deleteEquipmentController,
  getEquipmentByIdController,
  getEquipmentsByScanCenterController,
  getEquipmentsController,
  updateEquipmentController,
  createEquipmentServiceController,
  deleteEquipmentServiceController,
  getEquipmentServiceByIdController,
  getEquipmentServicesByEquipmentController,
  getEquipmentServicesByScanServiceController,
  getEquipmentServicesController,
} from "../controllers/equipment.controller";

const router = Router();

router.post("/equipment", createEquipmentController);

router.get("/equipment", getEquipmentsController);

router.get(
  "/equipment/scancenter/:scanCenterId",
  getEquipmentsByScanCenterController,
);

router.get(
  "/equipment/:equipmentId",
  getEquipmentByIdController,
);

router.put(
  "/equipment/:equipmentId",
  updateEquipmentController,
);

router.delete(
  "/equipment/:equipmentId",
  deleteEquipmentController,
);

router.post(
  "/equipmentservice",
  createEquipmentServiceController,
);

router.get(
  "/equipmentservices",
  getEquipmentServicesController,
);

router.get(
  "/equipmentservice/equipment/:equipmentId",
  getEquipmentServicesByEquipmentController,
);

router.get(
  "/equipmentservice/scanservice/:scanServiceId",
  getEquipmentServicesByScanServiceController,
);

router.get(
  "/equipmentservice/:equipmentServiceId",
  getEquipmentServiceByIdController,
);

router.delete(
  "/equipmentservice/:equipmentServiceId",
  deleteEquipmentServiceController,
);


export default router;