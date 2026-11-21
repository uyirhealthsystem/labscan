"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanServiceController = createScanServiceController;
exports.getScanServicesController = getScanServicesController;
exports.getScanServiceByIdController = getScanServiceByIdController;
exports.updateScanServiceController = updateScanServiceController;
exports.deleteScanServiceController = deleteScanServiceController;
const scanservice_service_1 = require("../services/scanservice.service");
const translate_response_1 = require("../utils/translate.response");
// =========================================================
// CREATE SCAN SERVICE
// =========================================================
async function createScanServiceController(req, res) {
    try {
        const { scanCenterId, serviceCatalogId, price, turnaroundTime, status, } = req.body;
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
        const scanService = await (0, scanservice_service_1.createScanService)({
            scanCenterId,
            serviceCatalogId,
            price,
            turnaroundTime,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanService, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create scan service",
        });
    }
}
// =========================================================
// GET ALL SERVICES FOR A SCAN CENTER
// =========================================================
async function getScanServicesController(req, res) {
    try {
        const { scanCenterId } = req.params;
        const scanServices = await (0, scanservice_service_1.getScanServices)(scanCenterId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanServices, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch scan services",
        });
    }
}
// =========================================================
// GET SINGLE SCAN SERVICE
// =========================================================
async function getScanServiceByIdController(req, res) {
    try {
        const { scanCenterId, scanServiceId, } = req.params;
        const scanService = await (0, scanservice_service_1.getScanServiceById)(scanCenterId, scanServiceId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanService, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Scan service not found",
        });
    }
}
// =========================================================
// UPDATE SCAN SERVICE
// =========================================================
async function updateScanServiceController(req, res) {
    try {
        const { scanCenterId, scanServiceId, } = req.params;
        const { price, turnaroundTime, status, } = req.body;
        const scanService = await (0, scanservice_service_1.updateScanService)(scanCenterId, scanServiceId, {
            price,
            turnaroundTime,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanService, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update scan service",
        });
    }
}
// =========================================================
// DELETE SCAN SERVICE
// =========================================================
async function deleteScanServiceController(req, res) {
    try {
        const { scanCenterId, scanServiceId, } = req.params;
        const scanService = await (0, scanservice_service_1.deleteScanService)(scanCenterId, scanServiceId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanService, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to delete scan service",
        });
    }
}
//# sourceMappingURL=scanservice.controller.js.map