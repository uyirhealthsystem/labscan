"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanServiceCatalogController = createScanServiceCatalogController;
exports.getScanServiceCatalogsController = getScanServiceCatalogsController;
exports.getScanServiceCatalogByIdController = getScanServiceCatalogByIdController;
exports.updateScanServiceCatalogController = updateScanServiceCatalogController;
exports.deleteScanServiceCatalogController = deleteScanServiceCatalogController;
const scancatalog_service_1 = require("../services/scancatalog.service");
const translate_response_1 = require("../utils/translate.response");
// =========================================================
// CREATE SCAN SERVICE CATALOG
// =========================================================
async function createScanServiceCatalogController(req, res) {
    try {
        const { code, name, description, category, status, } = req.body;
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
        const catalog = await (0, scancatalog_service_1.createScanServiceCatalog)({
            code,
            name,
            description,
            category,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(catalog, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create scan service catalog",
        });
    }
}
// =========================================================
// GET ALL SCAN SERVICE CATALOGS
// =========================================================
async function getScanServiceCatalogsController(req, res) {
    try {
        const catalogs = await (0, scancatalog_service_1.getScanServiceCatalogs)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(catalogs, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch scan service catalogs",
        });
    }
}
// =========================================================
// GET SCAN SERVICE CATALOG BY ID
// =========================================================
async function getScanServiceCatalogByIdController(req, res) {
    try {
        const catalog = await (0, scancatalog_service_1.getScanServiceCatalogById)(req.params.serviceCatalogId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(catalog, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Scan service catalog not found",
        });
    }
}
// =========================================================
// UPDATE SCAN SERVICE CATALOG
// =========================================================
async function updateScanServiceCatalogController(req, res) {
    try {
        const catalog = await (0, scancatalog_service_1.updateScanServiceCatalog)(req.params.serviceCatalogId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(catalog, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update scan service catalog",
        });
    }
}
// =========================================================
// DELETE SCAN SERVICE CATALOG
// =========================================================
async function deleteScanServiceCatalogController(req, res) {
    try {
        const catalog = await (0, scancatalog_service_1.deleteScanServiceCatalog)(req.params.serviceCatalogId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(catalog, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to delete scan service catalog",
        });
    }
}
//# sourceMappingURL=scancatalog.controller.js.map