"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const equipment_controller_1 = require("../controllers/equipment.controller");
const router = (0, express_1.Router)();
router.post("/equipment", equipment_controller_1.createEquipmentController);
router.get("/equipment", equipment_controller_1.getEquipmentsController);
router.get("/equipment/scancenter/:scanCenterId", equipment_controller_1.getEquipmentsByScanCenterController);
router.get("/equipment/:equipmentId", equipment_controller_1.getEquipmentByIdController);
router.put("/equipment/:equipmentId", equipment_controller_1.updateEquipmentController);
router.delete("/equipment/:equipmentId", equipment_controller_1.deleteEquipmentController);
router.post("/equipmentservice", equipment_controller_1.createEquipmentServiceController);
router.get("/equipmentservices", equipment_controller_1.getEquipmentServicesController);
router.get("/equipmentservice/equipment/:equipmentId", equipment_controller_1.getEquipmentServicesByEquipmentController);
router.get("/equipmentservice/scanservice/:scanServiceId", equipment_controller_1.getEquipmentServicesByScanServiceController);
router.get("/equipmentservice/:equipmentServiceId", equipment_controller_1.getEquipmentServiceByIdController);
router.delete("/equipmentservice/:equipmentServiceId", equipment_controller_1.deleteEquipmentServiceController);
exports.default = router;
//# sourceMappingURL=equipment.route.js.map