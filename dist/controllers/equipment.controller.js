"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEquipmentController = createEquipmentController;
exports.getEquipmentsController = getEquipmentsController;
exports.getEquipmentsByScanCenterController = getEquipmentsByScanCenterController;
exports.getEquipmentByIdController = getEquipmentByIdController;
exports.updateEquipmentController = updateEquipmentController;
exports.deleteEquipmentController = deleteEquipmentController;
exports.createEquipmentServiceController = createEquipmentServiceController;
exports.getEquipmentServicesController = getEquipmentServicesController;
exports.getEquipmentServicesByEquipmentController = getEquipmentServicesByEquipmentController;
exports.getEquipmentServicesByScanServiceController = getEquipmentServicesByScanServiceController;
exports.getEquipmentServiceByIdController = getEquipmentServiceByIdController;
exports.deleteEquipmentServiceController = deleteEquipmentServiceController;
const equipment_service_1 = require("../services/equipment.service");
const translate_response_1 = require("../utils/translate.response");
async function createEquipmentController(req, res) {
    try {
        const { scanCenterId, name, equipmentType, manufacturer, modelNumber, status, } = req.body;
        if (!scanCenterId || !name || !equipmentType) {
            return res.status(400).json({
                status: "error",
                message: "scanCenterId, name and equipmentType are required",
            });
        }
        const equipment = await (0, equipment_service_1.createEquipment)({
            scanCenterId,
            name,
            equipmentType,
            manufacturer,
            modelNumber,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Equipment created successfully",
            data: await (0, translate_response_1.translateResponse)(equipment, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create equipment",
        });
    }
}
async function getEquipmentsController(req, res) {
    try {
        const equipments = await (0, equipment_service_1.getEquipments)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(equipments, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch equipment",
        });
    }
}
async function getEquipmentsByScanCenterController(req, res) {
    try {
        const { scanCenterId } = req.params;
        const equipments = await (0, equipment_service_1.getEquipmentsByScanCenter)(scanCenterId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(equipments, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch equipment for scan center",
        });
    }
}
async function getEquipmentByIdController(req, res) {
    try {
        const { equipmentId } = req.params;
        const equipment = await (0, equipment_service_1.getEquipmentById)(equipmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(equipment, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Equipment not found",
        });
    }
}
async function updateEquipmentController(req, res) {
    try {
        const { equipmentId } = req.params;
        const equipment = await (0, equipment_service_1.updateEquipment)(equipmentId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Equipment updated successfully",
            data: await (0, translate_response_1.translateResponse)(equipment, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update equipment",
        });
    }
}
async function deleteEquipmentController(req, res) {
    try {
        const { equipmentId } = req.params;
        await (0, equipment_service_1.deleteEquipment)(equipmentId);
        return res.status(200).json({
            status: "success",
            message: "Equipment deleted successfully",
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to delete equipment",
        });
    }
}
async function createEquipmentServiceController(req, res) {
    try {
        const { equipmentId, scanServiceId } = req.body;
        if (!equipmentId || !scanServiceId) {
            return res.status(400).json({
                status: "error",
                message: "equipmentId and scanServiceId are required",
            });
        }
        const equipmentService = await (0, equipment_service_1.createEquipmentService)({
            equipmentId,
            scanServiceId,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Equipment service mapping created successfully",
            data: await (0, translate_response_1.translateResponse)(equipmentService, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create equipment service mapping",
        });
    }
}
async function getEquipmentServicesController(req, res) {
    try {
        const equipmentServices = await (0, equipment_service_1.getEquipmentServices)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(equipmentServices, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch equipment service mappings",
        });
    }
}
async function getEquipmentServicesByEquipmentController(req, res) {
    try {
        const { equipmentId } = req.params;
        const equipmentServices = await (0, equipment_service_1.getEquipmentServicesByEquipment)(equipmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(equipmentServices, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch services for equipment",
        });
    }
}
async function getEquipmentServicesByScanServiceController(req, res) {
    try {
        const { scanServiceId } = req.params;
        const equipmentServices = await (0, equipment_service_1.getEquipmentServicesByScanService)(scanServiceId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(equipmentServices, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch equipment services for scan service",
        });
    }
}
async function getEquipmentServiceByIdController(req, res) {
    try {
        const { equipmentServiceId } = req.params;
        const equipmentService = await (0, equipment_service_1.getEquipmentServiceById)(equipmentServiceId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(equipmentService, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Equipment service mapping not found",
        });
    }
}
async function deleteEquipmentServiceController(req, res) {
    try {
        const { equipmentServiceId } = req.params;
        await (0, equipment_service_1.deleteEquipmentService)(equipmentServiceId);
        return res.status(200).json({
            status: "success",
            message: "Equipment service mapping deleted successfully",
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to delete equipment service mapping",
        });
    }
}
//# sourceMappingURL=equipment.controller.js.map