import { Router } from "express";

import {
  createSampleController,
  getSamplesController,
  getSamplesByAppointmentTestController,
  getSampleByBarcodeController,
  getSampleByIdController,
  updateSampleController,
  deleteSampleController,
  generateCollectionOtpController,
  verifyCollectorCollectionOtpController,
  uploadCollectorSampleEvidenceController,
  updateCollectorSampleStatusController,
  generateSampleHandoverOtpController,
  verifySampleHandoverOtpController,
} from "../controllers/sample.controller";

import { userAuth } from "../middlewares/userauth";
import { reportUpload } from "../middlewares/upload.middleware";

const router = Router();

// All sample routes require an authenticated identity.
router.use(userAuth);

// Sample management
router.post("/sample", createSampleController);
router.get("/samples", getSamplesController);

router.get(
  "/sample/appointmenttest/:appointmentTestId",
  getSamplesByAppointmentTestController,
);

router.get(
  "/sample/barcode/:barcode",
  getSampleByBarcodeController,
);

router.get("/sample/:sampleId", getSampleByIdController);
router.put("/sample/:sampleId", updateSampleController);
router.delete("/sample/:sampleId", deleteSampleController);

// Collection OTP
router.post(
  "/sample/:sampleId/otp/generate",
  generateCollectionOtpController,
);

// Collector collection OTP verification
router.post(
  "/collector/samples/:sampleId/verify-otp",
  verifyCollectorCollectionOtpController,
);

// Collector evidence
router.post(
  "/collector/samples/:sampleId/evidence",
  reportUpload.single("file"),
  uploadCollectorSampleEvidenceController,
);

// Collector sample status
router.patch(
  "/collector/samples/:sampleId/status",
  updateCollectorSampleStatusController,
);

// Lab generates handover OTP
router.post(
  "/sample/:sampleId/handover-otp/generate",
  generateSampleHandoverOtpController,
);

// Collector verifies handover OTP
router.post(
  "/collector/samples/:sampleId/handover-otp/verify",
  verifySampleHandoverOtpController,
);

export default router;