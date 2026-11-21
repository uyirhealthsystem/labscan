"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sample_controller_1 = require("../controllers/sample.controller");
const userauth_1 = require("../middlewares/userauth");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// All sample routes require an authenticated identity.
router.use(userauth_1.userAuth);
// -----------------------------------------
// SAMPLE MANAGEMENT
// -----------------------------------------
router.post("/sample", sample_controller_1.createSampleController);
router.get("/samples", sample_controller_1.getSamplesController);
router.get("/collector/samples", sample_controller_1.getCollectorSamplesController);
router.get("/sample/appointmenttest/:appointmentTestId", sample_controller_1.getSamplesByAppointmentTestController);
router.get("/sample/barcode/:barcode", sample_controller_1.getSampleByBarcodeController);
router.get("/sample/:sampleId", sample_controller_1.getSampleByIdController);
router.put("/sample/:sampleId", sample_controller_1.updateSampleController);
router.delete("/sample/:sampleId", sample_controller_1.deleteSampleController);
// -----------------------------------------
// HOME COLLECTION OTP
// OTP is generated before samples are created.
// -----------------------------------------
router.post("/homecollection/:homeCollectionId/otp/generate", sample_controller_1.generateCollectionOtpController);
// Collector verifies the citizen's OTP.
router.post("/collector/homecollection/:homeCollectionId/verify-otp", sample_controller_1.verifyCollectorCollectionOtpController);
// -----------------------------------------
// COLLECTOR EVIDENCE
// -----------------------------------------
router.post("/collector/samples/:sampleId/evidence", upload_middleware_1.reportUpload.single("file"), sample_controller_1.uploadCollectorSampleEvidenceController);
// -----------------------------------------
// COLLECTOR SAMPLE STATUS
// -----------------------------------------
router.patch("/collector/samples/:sampleId/status", sample_controller_1.updateCollectorSampleStatusController);
// -----------------------------------------
// LAB HANDOVER OTP
// Sample-based OTP remains unchanged.
// -----------------------------------------
router.post("/sample/:sampleId/handover-otp/generate", sample_controller_1.generateSampleHandoverOtpController);
// Collector verifies lab handover OTP.
router.post("/collector/samples/:sampleId/handover-otp/verify", sample_controller_1.verifySampleHandoverOtpController);
exports.default = router;
//# sourceMappingURL=sample.route.js.map