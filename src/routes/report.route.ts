import { Router } from "express";
import { reportUpload } from "../middlewares/upload.middleware";
import {
  createReportController,
  getReportsController,
  uploadReportController,
  getReportByIdController,
  getReportByAppointmentController,
  updateReportController,
  deleteReportController,

  createReportFileController,
  getReportFilesController,
  getReportFileByIdController,
  updateReportFileController,
  deleteReportFileController,

  createEarningController,
  getEarningsController,
  getEarningsSummaryController,

  getEarningByIdController,
  getEarningByAppointmentController,
  updateEarningController,
  deleteEarningController,
} from "../controllers/report.controller";

const router = Router();


// =========================================================
// REPORT
// =========================================================

router.post("/report", createReportController);

router.get("/report", getReportsController);

router.post(
  "/report/upload",
  reportUpload.single("file"),
  uploadReportController,
);

router.get(
  "/report/appointment/:appointmentId",
  getReportByAppointmentController,
);

router.get(
  "/report/:reportId",
  getReportByIdController,
);

router.put(
  "/report/:reportId",
  updateReportController,
);

router.delete(
  "/report/:reportId",
  deleteReportController,
);


// =========================================================
// REPORT FILE
// =========================================================

router.post(
  "/reportfile",
  createReportFileController,
);

router.get(
  "/reportfile/report/:reportId",
  getReportFilesController,
);

router.get(
  "/reportfile/:reportFileId",
  getReportFileByIdController,
);

router.put(
  "/reportfile/:reportFileId",
  updateReportFileController,
);

router.delete(
  "/reportfile/:reportFileId",
  deleteReportFileController,
);


// =========================================================
// EARNING
// =========================================================

router.post(
  "/earning",
  createEarningController,
);

router.get(
  "/earning",
  getEarningsController,
);

router.get(
  "/earnings",
  getEarningsSummaryController,
);

router.get(
  "/earning/appointment/:appointmentId",
  getEarningByAppointmentController,
);

router.get(
  "/earning/:earningId",
  getEarningByIdController,
);

router.put(
  "/earning/:earningId",
  updateEarningController,
);

router.delete(
  "/earning/:earningId",
  deleteEarningController,
);

export default router;