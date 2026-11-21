"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabTestController = createLabTestController;
exports.getLabTestsController = getLabTestsController;
exports.getLabTestByIdController = getLabTestByIdController;
exports.updateLabTestController = updateLabTestController;
exports.deleteLabTestController = deleteLabTestController;
const labtest_service_1 = require("../services/labtest.service");
const translate_response_1 = require("../utils/translate.response");
// CREATE LAB TEST
async function createLabTestController(req, res) {
    try {
        const { labId, testCatalogId, price, turnaroundTime, status, } = req.body;
        if (!labId) {
            return res.status(400).json({
                status: "error",
                message: "labId is required",
            });
        }
        if (!testCatalogId) {
            return res.status(400).json({
                status: "error",
                message: "testCatalogId is required",
            });
        }
        const labTest = await (0, labtest_service_1.createLabTest)({
            labId,
            testCatalogId,
            price,
            turnaroundTime,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(labTest, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create lab test",
        });
    }
}
// GET ALL LAB TESTS FOR A LAB
async function getLabTestsController(req, res) {
    try {
        const { labId } = req.params;
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const labTests = await (0, labtest_service_1.getLabTests)(labId);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(labTests, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch lab tests",
        });
    }
}
// GET SINGLE LAB TEST
async function getLabTestByIdController(req, res) {
    try {
        const { labId, labTestId } = req.params;
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const labTest = await (0, labtest_service_1.getLabTestById)(labId, labTestId);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(labTest, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Lab test not found",
        });
    }
}
// UPDATE LAB TEST
async function updateLabTestController(req, res) {
    try {
        const { labId, labTestId } = req.params;
        const { price, turnaroundTime, status } = req.body;
        const labTest = await (0, labtest_service_1.updateLabTest)(labId, labTestId, {
            price,
            turnaroundTime,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(labTest, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update lab test",
        });
    }
}
// DELETE LAB TEST
async function deleteLabTestController(req, res) {
    try {
        const { labId, labTestId } = req.params;
        const labTest = await (0, labtest_service_1.deleteLabTest)(labId, labTestId);
        return res.status(200).json({
            status: "success",
            data: labTest,
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to delete lab test",
        });
    }
}
//# sourceMappingURL=labtest.controller.js.map