"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhookController = exports.createPatientPaymentLinkController = exports.getPatientHomeCollectionTrackingController = exports.downloadPatientReportFileController = exports.getPatientAppointmentReportsController = exports.getPatientAppointmentController = exports.getPatientHomeCollectionController = exports.getPatientHomeCollectionHistoryController = exports.getPatientHomeCollectionsController = exports.getPatientAppointmentsController = exports.getPatientTimeSlotsController = exports.getPatientScanCentersController = exports.getPatientLabsController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const requirepatient_1 = require("../utils/requirepatient");
const patient_service_1 = require("../services/patient.service");
const razorpay_service_1 = require("../services/razorpay.service");
const apiError_1 = require("../utils/apiError");
const timeslot_service_1 = require("../services/timeslot.service");
const sendSuccess = (res, data, statusCode = 200) => res.status(statusCode).json({ status: "success", data });
exports.getPatientLabsController = (0, asyncHandler_1.asyncHandler)(async (_req, res) => sendSuccess(res, await (0, patient_service_1.getPatientLabs)()));
exports.getPatientScanCentersController = (0, asyncHandler_1.asyncHandler)(async (_req, res) => sendSuccess(res, await (0, patient_service_1.getPatientScanCenters)()));
exports.getPatientTimeSlotsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const labId = typeof req.query.labId === "string" ? req.query.labId : undefined;
    const scanCenterId = typeof req.query.scanCenterId === "string" ? req.query.scanCenterId : undefined;
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    if ((!labId && !scanCenterId) || (labId && scanCenterId) || !date) {
        throw new apiError_1.apiError(400, "Provide one center ID and a date");
    }
    return sendSuccess(res, await (0, timeslot_service_1.getTimeSlots)({ labId, scanCenterId, date, isAvailable: true }));
});
exports.getPatientAppointmentsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, patient_service_1.getPatientAppointments)((0, requirepatient_1.requirePatientId)(req))));
exports.getPatientHomeCollectionsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, patient_service_1.getPatientHomeCollections)((0, requirepatient_1.requirePatientId)(req))));
exports.getPatientHomeCollectionHistoryController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, patient_service_1.getPatientHomeCollections)((0, requirepatient_1.requirePatientId)(req), true)));
exports.getPatientHomeCollectionController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, patient_service_1.getPatientHomeCollection)(String(req.params.homeCollectionId), (0, requirepatient_1.requirePatientId)(req))));
exports.getPatientAppointmentController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, patient_service_1.getPatientAppointment)(String(req.params.appointmentId), (0, requirepatient_1.requirePatientId)(req))));
exports.getPatientAppointmentReportsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, patient_service_1.getPatientAppointmentReports)(String(req.params.appointmentId), (0, requirepatient_1.requirePatientId)(req))));
exports.downloadPatientReportFileController = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const file = await (0, patient_service_1.getPatientReportFile)(String(req.params.reportId), String(req.params.reportFileId), (0, requirepatient_1.requirePatientId)(req));
    res.download(file.filePath, file.fileName, (error) => {
        if (error)
            next(error);
    });
});
exports.getPatientHomeCollectionTrackingController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, patient_service_1.getPatientHomeCollectionTracking)(String(req.params.homeCollectionId), (0, requirepatient_1.requirePatientId)(req))));
exports.createPatientPaymentLinkController = (0, asyncHandler_1.asyncHandler)(async (req, res) => sendSuccess(res, await (0, razorpay_service_1.createPatientPaymentLink)(String(req.params.appointmentId), (0, requirepatient_1.requirePatientId)(req)), 201));
exports.razorpayWebhookController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
        throw new apiError_1.apiError(400, "Razorpay webhook body is invalid");
    }
    const result = await (0, razorpay_service_1.processRazorpayWebhook)(req.body, req.header("x-razorpay-signature") ?? "", req.header("x-razorpay-event-id") ?? undefined);
    return res.status(200).json(result);
});
//# sourceMappingURL=patient.controller.js.map