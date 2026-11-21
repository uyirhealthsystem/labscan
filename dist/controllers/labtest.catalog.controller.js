"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabTestCatalogController = createLabTestCatalogController;
exports.getLabTestCatalogsController = getLabTestCatalogsController;
exports.getLabTestCatalogByIdController = getLabTestCatalogByIdController;
exports.updateLabTestCatalogController = updateLabTestCatalogController;
exports.deleteLabTestCatalogController = deleteLabTestCatalogController;
const labtest_catalog_service_1 = require("../services/labtest.catalog.service");
const translate_response_1 = require("../utils/translate.response");
// CREATE LAB TEST CATALOG
async function createLabTestCatalogController(req, res) {
    try {
        const { code, name, description, category, status, sampleType, fastingRequirement, fastingHours, preparationInstructions, } = req.body;
        if (!code || !name || !sampleType) {
            return res.status(400).json({
                status: "error",
                message: "code, name and sampletype are required",
            });
        }
        if (!sampleType) {
            return res.status(400).json({
                status: "error",
                message: "sampletype are required",
            });
        }
        const catalog = await (0, labtest_catalog_service_1.createLabTestCatalog)({
            code,
            name,
            description,
            category,
            status,
            sampleType,
            fastingRequirement,
            fastingHours,
            preparationInstructions,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Lab test catalog created successfully",
            data: await (0, translate_response_1.translateResponse)(catalog, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
// GET ALL LAB TEST CATALOGS
async function getLabTestCatalogsController(req, res) {
    try {
        const catalogs = await (0, labtest_catalog_service_1.getLabTestCatalogs)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(catalogs, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}
// GET LAB TEST CATALOG BY ID
async function getLabTestCatalogByIdController(req, res) {
    try {
        const { testCatalogId } = req.params;
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const catalog = await (0, labtest_catalog_service_1.getLabTestCatalogById)(testCatalogId);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(catalog, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
// UPDATE LAB TEST CATALOG
async function updateLabTestCatalogController(req, res) {
    try {
        const { testCatalogId } = req.params;
        const { code, name, description, category, status, fastingRequirement, fastingHours, preparationInstructions, } = req.body;
        const catalog = await (0, labtest_catalog_service_1.updateLabTestCatalog)(testCatalogId, {
            code,
            name,
            description,
            category,
            status,
            fastingRequirement,
            fastingHours,
            preparationInstructions,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Lab test catalog updated successfully",
            data: await (0, translate_response_1.translateResponse)(catalog, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
// DELETE LAB TEST CATALOG
async function deleteLabTestCatalogController(req, res) {
    try {
        const { testCatalogId } = req.params;
        await (0, labtest_catalog_service_1.deleteLabTestCatalog)(testCatalogId);
        return res.status(200).json({
            status: "success",
            message: "Lab test catalog deleted successfully",
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
//# sourceMappingURL=labtest.catalog.controller.js.map