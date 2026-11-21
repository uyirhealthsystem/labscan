"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
// =========================================================
// REPORT
// =========================================================
router.post("/report", report_controller_1.createReportController);
router.get("/reports", report_controller_1.getReportsController);
router.post("/reports/upload/:appointmentId", upload_middleware_1.reportUpload.single("file"), report_controller_1.uploadReportController);
router.get("/report/appointment/:appointmentId", report_controller_1.getReportByAppointmentController);
router.get("/report/:reportId", report_controller_1.getReportByIdController);
router.put("/report/:reportId", report_controller_1.updateReportController);
router.delete("/report/:reportId", report_controller_1.deleteReportController);
// =========================================================
// REPORT FILE
// =========================================================
router.post("/reportfile", report_controller_1.createReportFileController);
router.get("/reportfile/report/:reportId", report_controller_1.getReportFilesController);
router.get("/reportfile/:reportFileId", report_controller_1.getReportFileByIdController);
router.put("/reportfile/:reportFileId", report_controller_1.updateReportFileController);
router.delete("/reportfile/:reportFileId", report_controller_1.deleteReportFileController);
// =========================================================
// EARNING
// =========================================================
router.post("/earning", report_controller_1.createEarningController);
router.get("/earning", report_controller_1.getEarningsController);
router.get("/earnings", report_controller_1.getEarningsSummaryController);
router.get("/collectors/me/earnings", report_controller_1.getCollectorEarningsController);
router.get("/earning/appointment/:appointmentId", report_controller_1.getEarningByAppointmentController);
router.get("/earning/:earningId", report_controller_1.getEarningByIdController);
router.put("/earning/:earningId", report_controller_1.updateEarningController);
router.delete("/earning/:earningId", report_controller_1.deleteEarningController);
exports.default = router;
//# sourceMappingURL=report.route.js.map