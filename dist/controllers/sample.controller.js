"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCollectorHomeCollectionOtpController = exports.generateHomeCollectionOtpController = exports.updateCollectorSampleStatusController = exports.uploadCollectorSampleEvidenceController = exports.deleteSampleController = exports.updateSampleController = exports.verifySampleHandoverOtpController = exports.generateSampleHandoverOtpController = exports.verifyCollectorCollectionOtpController = exports.generateCollectionOtpController = exports.getSampleByBarcodeController = exports.getSampleByIdController = exports.getSamplesByAppointmentTestController = exports.getCollectorSamplesController = exports.getSamplesController = exports.createSampleController = void 0;
const promises_1 = require("node:fs/promises");
const asyncHandler_1 = require("../utils/asyncHandler");
const sample_service_1 = require("../services/sample.service");
const getUserId = (req) => {
    const userId = req.userId ||
        req.headers["x-user-id"];
    console.log("Collector User ID:", userId);
    if (!userId) {
        throw new Error("Authenticated user ID is missing");
    }
    return userId;
};
const getParam = (req, name) => String(req.params[name] ?? "");
const getBodyString = (value) => typeof value === "string" ? value.trim() : "";
const sendSuccess = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
// CREATE SAMPLE
exports.createSampleController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { appointmentTestId, homeCollectionId, barcode, sampleType, containerType, condition, notes, } = req.body;
    if (!appointmentTestId || !barcode || !sampleType) {
        return res.status(400).json({
            success: false,
            message: "appointmentTestId, barcode and sampleType are required",
        });
    }
    const sample = await (0, sample_service_1.createSample)({
        appointmentTestId,
        homeCollectionId,
        barcode,
        sampleType,
        containerType,
        condition,
        notes,
    }, getUserId(req));
    return sendSuccess(res, 201, "Sample created successfully", sample);
});
// GET ALL SAMPLES
exports.getSamplesController = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const samples = await (0, sample_service_1.getSamples)();
    return sendSuccess(res, 200, "Samples fetched successfully", samples);
});
// GET AUTHENTICATED COLLECTOR SAMPLES
exports.getCollectorSamplesController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, sample_service_1.getCollectorSamples)(getUserId(req));
    return sendSuccess(res, 200, "Collector samples fetched successfully", result);
});
// GET SAMPLES BY APPOINTMENT TEST
exports.getSamplesByAppointmentTestController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const appointmentTestId = getParam(req, "appointmentTestId");
    const samples = await (0, sample_service_1.getSamplesByAppointmentTest)(appointmentTestId);
    return sendSuccess(res, 200, "Appointment test samples fetched successfully", samples);
});
// GET SAMPLE BY ID
exports.getSampleByIdController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const sampleId = getParam(req, "sampleId");
    const sample = await (0, sample_service_1.getSampleById)(sampleId);
    return sendSuccess(res, 200, "Sample fetched successfully", sample);
});
// GET SAMPLE BY BARCODE
exports.getSampleByBarcodeController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const barcode = getParam(req, "barcode");
    const sample = await (0, sample_service_1.getSampleByBarcode)(barcode);
    return sendSuccess(res, 200, "Sample fetched successfully", sample);
});
// GENERATE HOME COLLECTION OTP
// OTP is generated before samples are created.
exports.generateCollectionOtpController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const homeCollectionId = getParam(req, "homeCollectionId");
    if (!homeCollectionId) {
        return res.status(400).json({
            success: false,
            message: "homeCollectionId is required",
        });
    }
    const result = await (0, sample_service_1.generateHomeCollectionOtp)(homeCollectionId, userId);
    return sendSuccess(res, 200, "Home collection OTP generated successfully", result);
});
// VERIFY HOME COLLECTION OTP - COLLECTOR ONLY
// Verification is reusable for all samples in this collection visit.
exports.verifyCollectorCollectionOtpController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const homeCollectionId = getParam(req, "homeCollectionId");
    const otp = getBodyString(req.body.otp);
    if (!homeCollectionId) {
        return res.status(400).json({
            success: false,
            message: "homeCollectionId is required",
        });
    }
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            success: false,
            message: "A valid 6-digit OTP is required",
        });
    }
    const result = await (0, sample_service_1.verifyCollectorHomeCollectionOtp)(homeCollectionId, otp, userId);
    return sendSuccess(res, 200, "Home collection OTP verified successfully", result);
});
// GENERATE LAB HANDOVER OTP
exports.generateSampleHandoverOtpController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const labUserId = getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const result = await (0, sample_service_1.generateSampleHandoverOtp)(sampleId, labUserId);
    return sendSuccess(res, 200, "Sample handover OTP generated successfully", result);
});
// VERIFY LAB HANDOVER OTP - COLLECTOR
exports.verifySampleHandoverOtpController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const otp = getBodyString(req.body.otp);
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            success: false,
            message: "A valid 6-digit OTP is required",
        });
    }
    const result = await (0, sample_service_1.verifySampleHandoverOtp)(sampleId, otp, userId);
    return sendSuccess(res, 200, "Sample handed over to lab successfully", result);
});
// UPDATE SAMPLE - LAB WORKFLOW
exports.updateSampleController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const { status, condition, rejectionReason, notes, } = req.body;
    const updatedSample = await (0, sample_service_1.updateSample)(sampleId, {
        status,
        condition,
        rejectionReason,
        notes,
    });
    return sendSuccess(res, 200, "Sample updated successfully", updatedSample);
});
// DELETE SAMPLE
exports.deleteSampleController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const deletedSample = await (0, sample_service_1.deleteSample)(sampleId);
    return sendSuccess(res, 200, "Sample deleted successfully", deletedSample);
});
// COLLECTOR UPLOAD EVIDENCE
exports.uploadCollectorSampleEvidenceController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const file = req.file;
    const type = getBodyString(req.body.type);
    if (!file) {
        return res.status(400).json({
            success: false,
            message: "Evidence file is required",
        });
    }
    if (type !== "COLLECTION_PHOTO" &&
        type !== "DELIVERY_PROOF") {
        await (0, promises_1.unlink)(file.path).catch(() => undefined);
        return res.status(400).json({
            success: false,
            message: "Evidence type must be COLLECTION_PHOTO or DELIVERY_PROOF",
        });
    }
    try {
        const evidence = await (0, sample_service_1.uploadCollectorSampleEvidence)(sampleId, userId, file, type);
        return sendSuccess(res, 201, "Sample evidence uploaded successfully", evidence);
    }
    catch (error) {
        await (0, promises_1.unlink)(file.path).catch(() => undefined);
        throw error;
    }
});
// COLLECTOR UPDATE SAMPLE STATUS
exports.updateCollectorSampleStatusController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const { status, condition, rejectionReason, notes, } = req.body;
    if (status !== "COLLECTED" && status !== "IN_TRANSIT") {
        return res.status(400).json({
            success: false,
            message: "Collector can only set COLLECTED or IN_TRANSIT status",
        });
    }
    const updatedSample = await (0, sample_service_1.updateCollectorSampleStatus)(sampleId, userId, {
        status,
        condition,
        rejectionReason,
        notes,
    });
    return sendSuccess(res, 200, "Collector sample status updated successfully", updatedSample);
});
// New descriptive aliases for route imports, if preferred.
exports.generateHomeCollectionOtpController = exports.generateCollectionOtpController;
exports.verifyCollectorHomeCollectionOtpController = exports.verifyCollectorCollectionOtpController;
//# sourceMappingURL=sample.controller.js.map