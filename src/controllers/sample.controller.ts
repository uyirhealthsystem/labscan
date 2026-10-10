
import { Request, Response } from "express";
import { unlink } from "node:fs/promises";

import {
  createSample,
  getSamples,
  getSamplesByAppointmentTest,
  getSampleById,
  getSampleByBarcode,
  updateSample,
  deleteSample,
  generateCollectionOtp,
  verifyCollectionOtp,
  verifyCollectorCollectionOtp,
  uploadCollectorSampleEvidence,
  updateCollectorSampleStatus,
} from "../services/sample.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// CREATE SAMPLE
// =========================================================

export const createSampleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      appointmentTestId,
      homeCollectionId,
      collectorId,
      barcode,
      sampleType,
      containerType,
      condition,
      notes,
    } = req.body;

    if (!appointmentTestId) {
      return res.status(400).json({
        status: "error",
        message: "appointmentTestId is required",
      });
    }

    if (!barcode) {
      return res.status(400).json({
        status: "error",
        message: "barcode is required",
      });
    }

    if (!sampleType) {
      return res.status(400).json({
        status: "error",
        message: "sampleType is required",
      });
    }

    const sample = await createSample({
      appointmentTestId,
      homeCollectionId,
      collectorId,
      barcode,
      sampleType,
      containerType,
      condition,
      notes,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      data: await translateResponse(sample, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to create sample",
    });
  }
};

// =========================================================
// GET ALL SAMPLES
// =========================================================

export const getSamplesController = async (
  req: Request,
  res: Response,
) => {
  try {
    const samples = await getSamples();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(samples, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to get samples",
    });
  }
};

// =========================================================
// GET SAMPLES BY APPOINTMENT TEST
// =========================================================

export const getSamplesByAppointmentTestController = async (
  req: Request,
  res: Response,
) => {
  try {
    const appointmentTestId = String(req.params.appointmentTestId);

    const samples =
      await getSamplesByAppointmentTest(appointmentTestId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(samples, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get samples for appointment test",
    });
  }
};

// =========================================================
// GET SAMPLE BY BARCODE
// =========================================================

export const getSampleByBarcodeController = async (
  req: Request,
  res: Response,
) => {
  try {
    const barcode = String(req.params.barcode);
    const sample = await getSampleByBarcode(barcode);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(sample, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Sample not found",
    });
  }
};

// =========================================================
// GET SAMPLE BY ID
// =========================================================

export const getSampleByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = String(req.params.sampleId);
    const sample = await getSampleById(sampleId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(sample, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Sample not found",
    });
  }
};

// =========================================================
// UPDATE SAMPLE
// =========================================================

export const updateSampleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = String(req.params.sampleId);

    const {
      status,
      condition,
      rejectionReason,
      notes,
    } = req.body;

    // collectedAt and receivedAt are intentionally not accepted
    // from the client. The service sets them automatically:
    // collectedAt -> when status becomes COLLECTED
    // receivedAt  -> when status becomes RECEIVED

    const sample = await updateSample(sampleId, {
      status,
      condition,
      rejectionReason,
      notes,
    });

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(sample, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to update sample",
    });
  }
};

// =========================================================
// DELETE SAMPLE
// =========================================================

export const deleteSampleController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = String(req.params.sampleId);

    await deleteSample(sampleId);

    return res.status(200).json({
      status: "success",
      message: "Sample deleted successfully",
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to delete sample",
    });
  }
};

// =========================================================
// GENERATE COLLECTION OTP
// =========================================================

export const generateCollectionOtpController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = String(req.params.sampleId);
    const result = await generateCollectionOtp(sampleId);

    // Do not translate OTP values or verification details.
    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate collection OTP",
    });
  }
};

// =========================================================
// VERIFY COLLECTION OTP
// =========================================================

export const verifyCollectionOtpController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = String(req.params.sampleId);
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        status: "error",
        message: "OTP is required",
      });
    }

    const result = await verifyCollectionOtp(
      sampleId,
      String(otp),
    );

    // Keep OTP verification result unchanged.
    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to verify collection OTP",
    });
  }
};

// =========================================================
// VERIFY COLLECTOR COLLECTION OTP
// =========================================================

export const verifyCollectorCollectionOtpController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = req.params.sampleId;
    const userId = req.headers["x-user-id"];
    const { otp } = req.body;

    if (typeof sampleId !== "string" || !sampleId) {
      return res.status(400).json({
        status: "error",
        message: "Valid sample ID is required",
      });
    }

    if (typeof userId !== "string" || !userId) {
      return res.status(401).json({
        status: "error",
        message: "Valid user ID is required",
      });
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        status: "error",
        message: "A valid six-digit OTP is required",
      });
    }

    const result = await verifyCollectorCollectionOtp(
      sampleId,
      otp,
      userId,
    );

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    const statusCode =
      message === "Sample not found" ||
      message === "No collector assignment found"
        ? 404
        : message === "Sample is not assigned to this collector"
          ? 403
          : message === "Collector must accept the assignment first"
            ? 409
            : 400;

    return res.status(statusCode).json({
      status: "error",
      message,
    });
  }
};

// =========================================================
// UPLOAD COLLECTOR SAMPLE EVIDENCE
// =========================================================

export const uploadCollectorSampleEvidenceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = req.params.sampleId;
    const userId = req.headers["x-user-id"];
    const type = req.body.type;

    if (typeof sampleId !== "string" || !sampleId) {
      return res.status(400).json({
        status: "error",
        message: "Valid sample ID is required",
      });
    }

    if (typeof userId !== "string" || !userId) {
      return res.status(401).json({
        status: "error",
        message: "Valid user ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Image file is required",
      });
    }

    if (
      type !== "COLLECTION_PHOTO" &&
      type !== "DELIVERY_PROOF"
    ) {
      return res.status(400).json({
        status: "error",
        message: "type must be COLLECTION_PHOTO or DELIVERY_PROOF",
      });
    }

    const evidence = await uploadCollectorSampleEvidence(
      sampleId,
      userId,
      req.file,
      type,
    );

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Evidence uploaded successfully",
      data: await translateResponse(evidence, language),
    });
  } catch (error: unknown) {
    // Remove the uploaded file if validation or ownership checks fail.
    if (req.file?.path) {
      await unlink(req.file.path).catch(() => undefined);
    }

    const message =
      error instanceof Error ? error.message : "Upload failed";

    const status =
      message === "Sample not found" ||
      message === "No collector assignment found"
        ? 404
        : message.includes("not assigned") ||
            message.includes("inactive")
          ? 403
          : message.includes("must") ||
              message.includes("Only JPG")
            ? 400
            : 500;

    return res.status(status).json({
      status: "error",
      message,
    });
  }
};

// =========================================================
// UPDATE COLLECTOR SAMPLE STATUS
// =========================================================

export const updateCollectorSampleStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    const sampleId = req.params.sampleId as string;
    const userId = req.headers["x-user-id"];

    const {
      status,
      condition,
      rejectionReason,
      notes,
    } = req.body;

    if (!sampleId) {
      return res.status(400).json({
        status: "error",
        message: "Sample ID is required",
      });
    }

    if (typeof userId !== "string" || !userId) {
      return res.status(401).json({
        status: "error",
        message: "Valid user ID is required",
      });
    }

    if (status !== "COLLECTED" && status !== "IN_TRANSIT") {
      return res.status(400).json({
        status: "error",
        message:
          "Collector can only update status to COLLECTED or IN_TRANSIT",
      });
    }

    const result = await updateCollectorSampleStatus(
      sampleId,
      userId,
      {
        status: status as "COLLECTED" | "IN_TRANSIT",
        condition,
        rejectionReason,
        notes,
      },
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Sample status updated successfully",
      data: await translateResponse(result, language),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Update failed";

    let statusCode = 400;

    if (
      message === "Sample not found" ||
      message === "No collector assignment found"
    ) {
      statusCode = 404;
    } else if (
      message.includes("not assigned") ||
      message.includes("inactive")
    ) {
      statusCode = 403;
    } else if (message.includes("must accept")) {
      statusCode = 409;
    }

    return res.status(statusCode).json({
      status: "error",
      message,
    });
  }
};

