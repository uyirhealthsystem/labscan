"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCancellationController = createCancellationController;
exports.getCancellationByAppointmentIdController = getCancellationByAppointmentIdController;
exports.createRescheduleController = createRescheduleController;
exports.getReschedulesByAppointmentController = getReschedulesByAppointmentController;
exports.getRescheduleByIdController = getRescheduleByIdController;
const appointmentlifecycle_service_1 = require("../services/appointmentlifecycle.service");
const translate_response_1 = require("../utils/translate.response");
// =========================================================
// CANCELLATION
// =========================================================
async function createCancellationController(req, res) {
    try {
        const { appointmentId, reason, additionalNotes, cancelledBy, } = req.body;
        if (!appointmentId || !reason) {
            return res.status(400).json({
                status: "error",
                message: "appointmentId and reason are required",
            });
        }
        const result = await (0, appointmentlifecycle_service_1.createCancellation)({
            appointmentId,
            reason,
            additionalNotes,
            cancelledBy,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Appointment cancelled successfully",
            data: await (0, translate_response_1.translateResponse)(result, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to cancel appointment",
        });
    }
}
async function getCancellationByAppointmentIdController(req, res) {
    try {
        const { appointmentId } = req.params;
        const cancellation = await (0, appointmentlifecycle_service_1.getCancellationByAppointmentId)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(cancellation, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Cancellation not found",
        });
    }
}
// =========================================================
// RESCHEDULE
// =========================================================
async function createRescheduleController(req, res) {
    try {
        const { appointmentId, newDate, newStartTime, newEndTime, reason, rescheduledBy, } = req.body;
        if (!appointmentId ||
            !newDate ||
            !newStartTime ||
            !newEndTime) {
            return res.status(400).json({
                status: "error",
                message: "appointmentId, newDate, newStartTime and newEndTime are required",
            });
        }
        const result = await (0, appointmentlifecycle_service_1.createReschedule)({
            appointmentId,
            newDate,
            newStartTime,
            newEndTime,
            reason,
            rescheduledBy,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Appointment rescheduled successfully",
            data: await (0, translate_response_1.translateResponse)(result, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to reschedule appointment",
        });
    }
}
async function getReschedulesByAppointmentController(req, res) {
    try {
        const { appointmentId } = req.params;
        const reschedules = await (0, appointmentlifecycle_service_1.getReschedulesByAppointment)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(reschedules, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch appointment reschedules",
        });
    }
}
async function getRescheduleByIdController(req, res) {
    try {
        const { rescheduleId } = req.params;
        const reschedule = await (0, appointmentlifecycle_service_1.getRescheduleById)(rescheduleId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(reschedule, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Reschedule not found",
        });
    }
}
//# sourceMappingURL=appointmentlifecycle.controller.js.map