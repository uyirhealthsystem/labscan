"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanCenterController = createScanCenterController;
exports.getScanCentersController = getScanCentersController;
exports.getScanCentersByDistrictController = getScanCentersByDistrictController;
exports.getScanCenterByIdController = getScanCenterByIdController;
exports.updateScanCenterController = updateScanCenterController;
exports.deleteScanCenterController = deleteScanCenterController;
exports.getScanCentersByUserIdController = getScanCentersByUserIdController;
exports.getScanCenterMetricsByDistrictController = getScanCenterMetricsByDistrictController;
const scan_service_1 = require("../services/scan.service");
const requireuser_1 = require("../utils/requireuser");
const translate_response_1 = require("../utils/translate.response");
// =========================================================
// CREATE SCAN CENTER
// =========================================================
async function createScanCenterController(req, res) {
    try {
        // Get scanCenterUserId from x-user-id header
        const userId = (0, requireuser_1.requireUserId)(req);
        const { name, registrationNumber, phone, email, address, districtId, status, } = req.body;
        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "name is required",
            });
        }
        const scanCenter = await (0, scan_service_1.createScanCenter)({
            scanCenterUserId: userId,
            name,
            registrationNumber,
            phone,
            email,
            address,
            districtId,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Scan center created successfully",
            data: await (0, translate_response_1.translateResponse)(scanCenter, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create scan center",
        });
    }
}
// =========================================================
// GET ALL SCAN CENTERS
// =========================================================
async function getScanCentersController(req, res) {
    try {
        const scanCenters = await (0, scan_service_1.getScanCenters)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanCenters, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch scan centers",
        });
    }
}
// =========================================================
// GET SCAN CENTERS BY DISTRICT
// =========================================================
async function getScanCentersByDistrictController(req, res) {
    try {
        const districtId = req.params.districtId;
        if (!districtId) {
            res.status(400).json({
                status: "error",
                message: "districtId is required",
            });
            return;
        }
        const scanCenters = await (0, scan_service_1.getScanCentersByDistrict)(districtId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            districtId,
            data: await (0, translate_response_1.translateResponse)(scanCenters, language),
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch scan centers by district",
        });
    }
}
// =========================================================
// GET SCAN CENTER BY ID
// =========================================================
async function getScanCenterByIdController(req, res) {
    try {
        const { scanCenterId } = req.params;
        const scanCenter = await (0, scan_service_1.getScanCenterById)(scanCenterId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanCenter, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Scan center not found",
        });
    }
}
// =========================================================
// UPDATE SCAN CENTER
// =========================================================
async function updateScanCenterController(req, res) {
    try {
        const { scanCenterId } = req.params;
        const scanCenter = await (0, scan_service_1.updateScanCenter)(scanCenterId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Scan center updated successfully",
            data: await (0, translate_response_1.translateResponse)(scanCenter, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update scan center",
        });
    }
}
// =========================================================
// DELETE SCAN CENTER - SOFT DELETE
// =========================================================
async function deleteScanCenterController(req, res) {
    try {
        const { scanCenterId } = req.params;
        const scanCenter = await (0, scan_service_1.deleteScanCenter)(scanCenterId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Scan center deactivated successfully",
            data: await (0, translate_response_1.translateResponse)({
                scanCenterId: scanCenter.scanCenterId,
                name: scanCenter.name,
                status: scanCenter.status,
            }, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Scan center not found",
        });
    }
}
// =========================================================
// GET SCAN CENTERS BY USER ID
// =========================================================
async function getScanCentersByUserIdController(req, res) {
    try {
        const userId = (0, requireuser_1.requireUserId)(req);
        const scanCenters = await (0, scan_service_1.getScanCentersByUserId)(userId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(scanCenters, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch scan centers for user",
        });
    }
}
// =========================================================
// GET SCAN CENTER METRICS BY DISTRICT
// =========================================================
async function getScanCenterMetricsByDistrictController(req, res) {
    try {
        const districtId = req.params.districtId;
        if (!districtId) {
            return res.status(400).json({
                status: "error",
                message: "districtId is required",
            });
        }
        const data = await (0, scan_service_1.getScanCenterMetricsByDistrict)(districtId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            districtId,
            data: await (0, translate_response_1.translateResponse)(data, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch scan center metrics",
        });
    }
}
//# sourceMappingURL=scan.controller.js.map