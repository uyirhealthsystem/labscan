"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEarningsSummaryController = void 0;
exports.createReportController = createReportController;
exports.getReportsController = getReportsController;
exports.uploadReportController = uploadReportController;
exports.getReportByIdController = getReportByIdController;
exports.getReportByAppointmentController = getReportByAppointmentController;
exports.updateReportController = updateReportController;
exports.deleteReportController = deleteReportController;
exports.createReportFileController = createReportFileController;
exports.getReportFilesController = getReportFilesController;
exports.getReportFileByIdController = getReportFileByIdController;
exports.updateReportFileController = updateReportFileController;
exports.deleteReportFileController = deleteReportFileController;
exports.createEarningController = createEarningController;
exports.getEarningsController = getEarningsController;
exports.getCollectorEarningsController = getCollectorEarningsController;
exports.getEarningByIdController = getEarningByIdController;
exports.getEarningByAppointmentController = getEarningByAppointmentController;
exports.updateEarningController = updateEarningController;
exports.deleteEarningController = deleteEarningController;
const report_service_1 = require("../services/report.service");
const translate_response_1 = require("../utils/translate.response");
// =========================================================
// REPORT CONTROLLERS
// =========================================================
async function createReportController(req, res) {
    try {
        const report = await (0, report_service_1.createReport)(req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(201).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(report, language),
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create report",
        });
    }
}
async function getReportsController(req, res) {
    try {
        const reports = await (0, report_service_1.getReports)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(reports, language),
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch reports",
        });
    }
}
async function uploadReportController(req, res) {
    try {
        const appointmentId = String(req.params.appointmentId ?? "");
        console.log("UPLOAD DEBUG:", {
            params: req.params,
            body: req.body,
            fileReceived: Boolean(req.file),
        });
        const appointmentTestId = typeof req.body?.appointmentTestId === "string"
            ? req.body.appointmentTestId.trim()
            : undefined;
        const file = req.file;
        if (!appointmentId || appointmentId === "undefined") {
            res.status(400).json({
                status: "error",
                message: "Appointment ID is required in the URL",
            });
            return;
        }
        if (!file) {
            res.status(400).json({
                status: "error",
                message: "Report file is required",
            });
            return;
        }
        const result = await (0, report_service_1.uploadReport)(appointmentId, {
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
        }, appointmentTestId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            message: "Report uploaded successfully",
            data: await (0, translate_response_1.translateResponse)(result, language),
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to upload report",
        });
    }
}
async function getReportByIdController(req, res) {
    try {
        const reportId = String(req.params.reportId);
        const report = await (0, report_service_1.getReportById)(reportId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(report, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Report not found",
        });
    }
}
async function getReportByAppointmentController(req, res) {
    try {
        const appointmentId = String(req.params.appointmentId);
        const report = await (0, report_service_1.getReportByAppointment)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(report, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Report not found",
        });
    }
}
async function updateReportController(req, res) {
    try {
        const reportId = String(req.params.reportId);
        const report = await (0, report_service_1.updateReport)(reportId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(report, language),
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update report",
        });
    }
}
async function deleteReportController(req, res) {
    try {
        const reportId = String(req.params.reportId);
        const report = await (0, report_service_1.deleteReport)(reportId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(report, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Report not found",
        });
    }
}
// =========================================================
// REPORT FILE CONTROLLERS
// =========================================================
async function createReportFileController(req, res) {
    try {
        const reportFile = await (0, report_service_1.createReportFile)(req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(201).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(reportFile, language),
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create report file",
        });
    }
}
async function getReportFilesController(req, res) {
    try {
        const reportId = String(req.params.reportId);
        const files = await (0, report_service_1.getReportFiles)(reportId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(files, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch report files",
        });
    }
}
async function getReportFileByIdController(req, res) {
    try {
        const reportFileId = String(req.params.reportFileId);
        const file = await (0, report_service_1.getReportFileById)(reportFileId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(file, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Report file not found",
        });
    }
}
async function updateReportFileController(req, res) {
    try {
        const reportFileId = String(req.params.reportFileId);
        const file = await (0, report_service_1.updateReportFile)(reportFileId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(file, language),
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update report file",
        });
    }
}
async function deleteReportFileController(req, res) {
    try {
        const reportFileId = String(req.params.reportFileId);
        const file = await (0, report_service_1.deleteReportFile)(reportFileId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(file, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Report file not found",
        });
    }
}
// =========================================================
// EARNING CONTROLLERS
// =========================================================
async function createEarningController(req, res) {
    try {
        const earning = await (0, report_service_1.createEarning)(req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(201).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(earning, language),
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create earning",
        });
    }
}
async function getEarningsController(req, res) {
    try {
        const earnings = await (0, report_service_1.getEarnings)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(earnings, language),
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch earnings",
        });
    }
}
const getEarningsSummaryController = async (req, res) => {
    try {
        const summary = await (0, report_service_1.getEarningsSummary)();
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(summary, language),
        });
    }
    catch (error) {
        console.error("Get earnings summary error:", error);
        res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to get earnings summary",
        });
    }
};
exports.getEarningsSummaryController = getEarningsSummaryController;
async function getCollectorEarningsController(req, res) {
    try {
        const userId = req.header("x-user-id")?.trim();
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Authenticated user ID is required",
            });
            return;
        }
        const result = await (0, report_service_1.getCollectorEarningsByUserId)(userId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(result, language),
        });
    }
    catch (error) {
        res.status(error instanceof Error && /not found/i.test(error.message) ? 404 : 500).json({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to fetch collector earnings",
        });
    }
}
async function getEarningByIdController(req, res) {
    try {
        const earningId = String(req.params.earningId);
        const earning = await (0, report_service_1.getEarningById)(earningId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(earning, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Earning not found",
        });
    }
}
async function getEarningByAppointmentController(req, res) {
    try {
        const appointmentId = String(req.params.appointmentId);
        const earning = await (0, report_service_1.getEarningByAppointment)(appointmentId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(earning, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Earning not found",
        });
    }
}
async function updateEarningController(req, res) {
    try {
        const earningId = String(req.params.earningId);
        const earning = await (0, report_service_1.updateEarning)(earningId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(earning, language),
        });
    }
    catch (error) {
        res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update earning",
        });
    }
}
async function deleteEarningController(req, res) {
    try {
        const earningId = String(req.params.earningId);
        const earning = await (0, report_service_1.deleteEarning)(earningId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(earning, language),
        });
    }
    catch (error) {
        res.status(404).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Earning not found",
        });
    }
}
//# sourceMappingURL=report.controller.js.map