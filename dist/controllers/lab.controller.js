"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabController = createLabController;
exports.getLabsController = getLabsController;
exports.getLabsByDistrictController = getLabsByDistrictController;
exports.getLabByIdController = getLabByIdController;
exports.updateLabController = updateLabController;
exports.deleteLabController = deleteLabController;
exports.getLabsByUserIdController = getLabsByUserIdController;
exports.getLabMetricsByDistrictController = getLabMetricsByDistrictController;
const lab_service_1 = require("../services/lab.service");
const requireuser_1 = require("../utils/requireuser");
const translate_response_1 = require("../utils/translate.response");
// CREATE LAB
async function createLabController(req, res) {
    try {
        const userId = (0, requireuser_1.requireUserId)(req);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const translatedBody = await (0, translate_response_1.translateInputToEnglish)(req.body, language);
        const { name, registrationNumber, phone, email, address, districtId, status, } = translatedBody;
        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "name is required",
            });
        }
        const lab = await (0, lab_service_1.createLab)({
            labUserId: userId,
            name,
            registrationNumber,
            phone,
            email,
            address,
            districtId,
            status,
        });
        return res.status(201).json({
            status: "success",
            message: "Lab created successfully",
            data: await (0, translate_response_1.translateResponse)(lab, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
// GET ALL LABS
async function getLabsController(req, res) {
    try {
        const labs = await (0, lab_service_1.getLabs)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(labs, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}
// GET LABS BY DISTRICT
async function getLabsByDistrictController(req, res) {
    try {
        const districtId = req.params.districtId;
        if (!districtId) {
            res.status(400).json({
                status: "error",
                message: "districtId is required",
            });
            return;
        }
        const labs = await (0, lab_service_1.getLabsByDistrict)(districtId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            districtId,
            data: await (0, translate_response_1.translateResponse)(labs, language),
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}
// GET LAB BY ID
async function getLabByIdController(req, res) {
    try {
        const { labId } = req.params;
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const lab = await (0, lab_service_1.getLabById)(labId);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(lab, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
// UPDATE LAB
async function updateLabController(req, res) {
    try {
        const { labId } = req.params;
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const translatedBody = await (0, translate_response_1.translateInputToEnglish)(req.body, language);
        const lab = await (0, lab_service_1.updateLab)(labId, translatedBody);
        return res.status(200).json({
            status: "success",
            message: "Lab updated successfully",
            data: await (0, translate_response_1.translateResponse)(lab, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
// DELETE LAB
async function deleteLabController(req, res) {
    try {
        const { labId } = req.params;
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const lab = await (0, lab_service_1.deleteLab)(labId);
        return res.status(200).json({
            status: "success",
            message: "Lab deactivated successfully",
            data: await (0, translate_response_1.translateResponse)({
                labId: lab.labId,
                name: lab.name,
                status: lab.status,
            }, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
// GET LABS BY USER ID
async function getLabsByUserIdController(req, res) {
    try {
        const userId = (0, requireuser_1.requireUserId)(req);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        const labs = await (0, lab_service_1.getLabsByUserId)(userId);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(labs, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}
// GET LAB METRICS BY DISTRICT
async function getLabMetricsByDistrictController(req, res) {
    try {
        const districtId = req.params.districtId;
        const data = await (0, lab_service_1.getLabMetricsByDistrict)(districtId);
        return res.status(200).json({
            status: "success",
            districtId,
            data,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}
//# sourceMappingURL=lab.controller.js.map