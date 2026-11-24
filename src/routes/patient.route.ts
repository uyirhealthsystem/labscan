import { Router } from "express";
import { createAppointmentController } from "../controllers/appointment.controller";
import {
  downloadPatientReportFileController,
  createPatientPaymentLinkController,
  getPatientAppointmentController,
  getPatientAppointmentReportsController,
  getPatientAppointmentsController,
  getPatientHomeCollectionController,
  getPatientHomeCollectionHistoryController,
  getPatientHomeCollectionsController,
  getPatientHomeCollectionTrackingController,
  getPatientLabsController,
  getPatientScanCentersController,
  getPatientTimeSlotsController,
} from "../controllers/patient.controller";
import { requirePatient } from "../utils/requirepatient";

const router = Router();

router.use(requirePatient);

router.get("/labs", getPatientLabsController);
router.get("/scan-centers", getPatientScanCentersController);
router.get("/time-slots", getPatientTimeSlotsController);

router.get("/appointments", getPatientAppointmentsController);
router.post("/appointments", createAppointmentController);
router.get("/home-collections", getPatientHomeCollectionsController);
router.get("/home-collections/history", getPatientHomeCollectionHistoryController);
router.get("/home-collections/:homeCollectionId", getPatientHomeCollectionController);
router.get("/home-collections/:homeCollectionId/tracking", getPatientHomeCollectionTrackingController);
router.get("/appointments/:appointmentId", getPatientAppointmentController);
router.get("/appointments/:appointmentId/reports", getPatientAppointmentReportsController);
router.post("/appointments/:appointmentId/payment", createPatientPaymentLinkController);
router.get(
  "/reports/:reportId/files/:reportFileId",
  downloadPatientReportFileController,
);
export default router;
