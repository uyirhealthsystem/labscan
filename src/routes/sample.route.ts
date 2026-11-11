
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

// -----------------------------------------
// SAMPLE MANAGEMENT
// -----------------------------------------

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

router.get(
  "/sample/:sampleId",
  getSampleByIdController,
);

router.put(
  "/sample/:sampleId",
  updateSampleController,
);

router.delete(
  "/sample/:sampleId",
  deleteSampleController,
);

// -----------------------------------------
// HOME COLLECTION OTP
// OTP is generated before samples are created.
// -----------------------------------------

router.post(
  "/homecollection/:homeCollectionId/otp/generate",
  generateCollectionOtpController,
);

// Collector verifies the citizen's OTP.
router.post(
  "/collector/homecollection/:homeCollectionId/verify-otp",
  verifyCollectorCollectionOtpController,
);

// -----------------------------------------
// COLLECTOR EVIDENCE
// -----------------------------------------

router.post(
  "/collector/samples/:sampleId/evidence",
  reportUpload.single("file"),
  uploadCollectorSampleEvidenceController,
);

// -----------------------------------------
// COLLECTOR SAMPLE STATUS
// -----------------------------------------

router.patch(
  "/collector/samples/:sampleId/status",
  updateCollectorSampleStatusController,
);

// -----------------------------------------
// LAB HANDOVER OTP
// Sample-based OTP remains unchanged.
// -----------------------------------------

router.post(
  "/sample/:sampleId/handover-otp/generate",
  generateSampleHandoverOtpController,
);

// Collector verifies lab handover OTP.
router.post(
  "/collector/samples/:sampleId/handover-otp/verify",
  verifySampleHandoverOtpController,
);

export default router;
