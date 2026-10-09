
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
  verifyCollectionOtpController,
  verifyCollectorCollectionOtpController,
  uploadCollectorSampleEvidenceController,
  updateCollectorSampleStatusController
} from "../controllers/sample.controller";



import { reportUpload } from "../middlewares/upload.middleware";

const router = Router();

// =========================================================
// SAMPLE
// =========================================================

// Create sample / barcode record
router.post(
  "/sample",
  createSampleController,
);

// Get all samples
router.get(
  "/samples",
  getSamplesController,
);

// Get samples by appointment test
router.get(
  "/sample/appointmenttest/:appointmentTestId",
  getSamplesByAppointmentTestController,
);

// Get sample by barcode
router.get(
  "/sample/barcode/:barcode",
  getSampleByBarcodeController,
);

// =========================================================
// OTP
// =========================================================

// Generate collection OTP
router.post(
  "/sample/:sampleId/otp/generate",
  generateCollectionOtpController,
);

// Verify collection OTP
router.post(
  "/sample/:sampleId/otp/verify",
  verifyCollectionOtpController,
);

router.post(
  "/collector/samples/:sampleId/verify-otp",
  verifyCollectorCollectionOtpController,
);

router.patch(
  "/collector/samples/:sampleId/status",
  updateCollectorSampleStatusController,
);


router.post(
  "/collector/samples/:sampleId/evidence",
  reportUpload.single("file"),
  uploadCollectorSampleEvidenceController,
);
// =========================================================
// SAMPLE BY ID
// =========================================================

router.get(
  "/sample/:sampleId",
  getSampleByIdController,
);

// Update sample status
router.put(
  "/sample/:sampleId",
  updateSampleController,
);

// Delete sample
router.delete(
  "/sample/:sampleId",
  deleteSampleController,
);

export default router;

