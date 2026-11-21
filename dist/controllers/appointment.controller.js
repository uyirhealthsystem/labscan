"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeAppointmentController = void 0;
exports.createAppointmentController = createAppointmentController;
exports.getAppointmentsController = getAppointmentsController;
exports.getAppointmentsByLabIdController = getAppointmentsByLabIdController;
exports.getAppointmentsByPatientController = getAppointmentsByPatientController;
exports.getAppointmentByIdController = getAppointmentByIdController;
exports.updateAppointmentController = updateAppointmentController;
exports.deleteAppointmentController = deleteAppointmentController;
exports.createAppointmentTestController = createAppointmentTestController;
exports.getAllAppointmentTestsController = getAllAppointmentTestsController;
exports.getAppointmentTestsController = getAppointmentTestsController;
exports.getAppointmentTestByIdController = getAppointmentTestByIdController;
exports.updateAppointmentTestController = updateAppointmentTestController;
exports.deleteAppointmentTestController = deleteAppointmentTestController;
exports.createAppointmentServiceController = createAppointmentServiceController;
exports.getAllAppointmentServicesController = getAllAppointmentServicesController;
exports.getAppointmentServicesController = getAppointmentServicesController;
exports.getAppointmentServiceByIdController = getAppointmentServiceByIdController;
exports.updateAppointmentServiceController = updateAppointmentServiceController;
exports.deleteAppointmentServiceController = deleteAppointmentServiceController;
const appointment_service_1 = require("../services/appointment.service");
const translate_response_1 = require("../utils/translate.response");
const requireuser_1 = require("../utils/requireuser");
// =========================================================
// APPOINTMENT
// =========================================================
async function createAppointmentController(req, res) {
    try {
        const userId = req.headers["x-user-id"];
        if (typeof userId !== "string" || !userId.trim()) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }
        const { labId, scanCenterId, appointmentType, appointmentMode, appointmentDate, startTime, endTime, address, latitude, longitude, specialInstructions, status, patientNotes, tests, services, } = req.body;
        if (!appointmentType ||
            !appointmentMode ||
            !appointmentDate ||
            !startTime ||
            !endTime) {
            return res.status(400).json({
                status: "error",
                message: "appointmentType, appointmentMode, appointmentDate, startTime and endTime are required",
            });
        }
        const appointment = await (0, appointment_service_1.createAppointment)({
            patientId: userId.trim(),
            labId,
            scanCenterId,
            appointmentType,
            appointmentMode,
            appointmentDate,
            startTime,
            endTime,
            address,
            latitude,
            longitude,
            specialInstructions,
            status,
            patientNotes,
            tests,
            services,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Appointment created successfully",
            data: await (0, translate_response_1.translateResponse)(appointment, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function getAppointmentsController(req, res) {
    try {
        const appointments = await (0, appointment_service_1.getAppointments)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointments, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}
const completeAppointmentController = async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        const appointment = await (0, appointment_service_1.completeAppointment)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Appointment completed successfully",
            data: await (0, translate_response_1.translateResponse)(appointment, language),
        });
    }
    catch (error) {
        console.error("Complete appointment error:", error);
        if (error.message === "Appointment not found") {
            return res.status(404).json({
                status: "error",
                message: error.message,
            });
        }
        return res.status(400).json({
            status: "error",
            message: error.message || "Failed to complete appointment",
        });
    }
};
exports.completeAppointmentController = completeAppointmentController;
// =========================================================
// GET APPOINTMENTS BY LAB ID
// =========================================================
async function getAppointmentsByLabIdController(req, res) {
    try {
        const userId = (0, requireuser_1.requireUserId)(req);
        const { labId } = req.params;
        if (!labId) {
            return res.status(400).json({
                status: "error",
                message: "Lab ID is required",
            });
        }
        const appointments = await (0, appointment_service_1.getAppointmentsByLabId)(labId, userId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointments, language),
        });
    }
    catch (error) {
        const message = error?.message || "Failed to fetch lab appointments";
        if (message === "Authentication required" ||
            message === "User ID required") {
            return res.status(401).json({
                status: "error",
                message,
            });
        }
        if (message === "Lab not found or access denied") {
            return res.status(403).json({
                status: "error",
                message,
            });
        }
        return res.status(500).json({
            status: "error",
            message,
        });
    }
}
async function getAppointmentsByPatientController(req, res) {
    try {
        const { patientId } = req.params;
        const appointments = await (0, appointment_service_1.getAppointmentsByPatient)(patientId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointments, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function getAppointmentByIdController(req, res) {
    try {
        const { appointmentId } = req.params;
        const appointment = await (0, appointment_service_1.getAppointmentById)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointment, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
async function updateAppointmentController(req, res) {
    try {
        const { appointmentId } = req.params;
        const appointment = await (0, appointment_service_1.updateAppointment)(appointmentId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Appointment updated successfully",
            data: await (0, translate_response_1.translateResponse)(appointment, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function deleteAppointmentController(req, res) {
    try {
        const { appointmentId } = req.params;
        await (0, appointment_service_1.deleteAppointment)(appointmentId);
        return res.status(200).json({
            status: "success",
            message: "Appointment deleted successfully",
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
// =========================================================
// APPOINTMENT TEST
// =========================================================
async function createAppointmentTestController(req, res) {
    try {
        const { appointmentId, labTestId, status } = req.body;
        if (!appointmentId || !labTestId) {
            return res.status(400).json({
                status: "error",
                message: "appointmentId and labTestId are required",
            });
        }
        const appointmentTest = await (0, appointment_service_1.createAppointmentTest)({
            appointmentId,
            labTestId,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Appointment test added successfully",
            data: await (0, translate_response_1.translateResponse)(appointmentTest, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function getAllAppointmentTestsController(req, res) {
    try {
        const appointmentTests = await (0, appointment_service_1.getAllAppointmentTests)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointmentTests, language),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch appointment tests",
        });
    }
}
async function getAppointmentTestsController(req, res) {
    try {
        const { appointmentId } = req.params;
        const tests = await (0, appointment_service_1.getAppointmentTests)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(tests, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function getAppointmentTestByIdController(req, res) {
    try {
        const { appointmentTestId } = req.params;
        const appointmentTest = await (0, appointment_service_1.getAppointmentTestById)(appointmentTestId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointmentTest, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
async function updateAppointmentTestController(req, res) {
    try {
        const { appointmentTestId } = req.params;
        const appointmentTest = await (0, appointment_service_1.updateAppointmentTest)(appointmentTestId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Appointment test updated successfully",
            data: await (0, translate_response_1.translateResponse)(appointmentTest, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function deleteAppointmentTestController(req, res) {
    try {
        const { appointmentTestId } = req.params;
        await (0, appointment_service_1.deleteAppointmentTest)(appointmentTestId);
        return res.status(200).json({
            status: "success",
            message: "Appointment test deleted successfully",
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
// =========================================================
// APPOINTMENT SERVICE
// =========================================================
async function createAppointmentServiceController(req, res) {
    try {
        const { appointmentId, scanServiceId, equipmentId, status, } = req.body;
        if (!appointmentId || !scanServiceId) {
            return res.status(400).json({
                status: "error",
                message: "appointmentId and scanServiceId are required",
            });
        }
        const appointmentService = await (0, appointment_service_1.createAppointmentService)({
            appointmentId,
            scanServiceId,
            equipmentId,
            status,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Appointment service added successfully",
            data: await (0, translate_response_1.translateResponse)(appointmentService, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function getAllAppointmentServicesController(req, res) {
    try {
        const appointmentServices = await (0, appointment_service_1.getAllAppointmentServices)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointmentServices, language),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch appointment services",
        });
    }
}
async function getAppointmentServicesController(req, res) {
    try {
        const { appointmentId } = req.params;
        const services = await (0, appointment_service_1.getAppointmentServices)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(services, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function getAppointmentServiceByIdController(req, res) {
    try {
        const { appointmentServiceId } = req.params;
        const appointmentService = await (0, appointment_service_1.getAppointmentServiceById)(appointmentServiceId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(appointmentService, language),
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
async function updateAppointmentServiceController(req, res) {
    try {
        const { appointmentServiceId } = req.params;
        const appointmentService = await (0, appointment_service_1.updateAppointmentService)(appointmentServiceId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Appointment service updated successfully",
            data: await (0, translate_response_1.translateResponse)(appointmentService, language),
        });
    }
    catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
}
async function deleteAppointmentServiceController(req, res) {
    try {
        const { appointmentServiceId } = req.params;
        await (0, appointment_service_1.deleteAppointmentService)(appointmentServiceId);
        return res.status(200).json({
            status: "success",
            message: "Appointment service deleted successfully",
        });
    }
    catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
}
//# sourceMappingURL=appointment.controller.js.map