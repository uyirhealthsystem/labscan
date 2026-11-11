
import type { Request, Response } from "express";
import { unlink } from "node:fs/promises";

import { asyncHandler } from "../utils/asyncHandler";

import {
  createSample,
  getSamples,
  getSamplesByAppointmentTest,
  getSampleById,
  getSampleByBarcode,
  updateSample,
  deleteSample,
  generateHomeCollectionOtp,
  verifyCollectorHomeCollectionOtp,
  uploadCollectorSampleEvidence,
  updateCollectorSampleStatus,
  generateSampleHandoverOtp,
  verifySampleHandoverOtp,
} from "../services/sample.service";

type AuthenticatedRequest = Request & {
  userId?: string;
};

const getUserId = (req: Request): string => {
  const userId = (req as AuthenticatedRequest).userId;

  if (!userId) {
    throw new Error("Authenticated user ID is missing");
  }

  return userId;
};

const getParam = (req: Request, name: string): string =>
  String(req.params[name] ?? "");

const getBodyString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data: unknown,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// CREATE SAMPLE
export const createSampleController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      appointmentTestId,
      homeCollectionId,
      barcode,
      sampleType,
      containerType,
      condition,
      notes,
    } = req.body;

    if (!appointmentTestId || !barcode || !sampleType) {
      return res.status(400).json({
        success: false,
        message: "appointmentTestId, barcode and sampleType are required",
      });
    }

    const sample = await createSample(
  {
    appointmentTestId,
    homeCollectionId,
    barcode,
    sampleType,
    containerType,
    condition,
    notes,
  },
  getUserId(req),
);
    return sendSuccess(
      res,
      201,
      "Sample created successfully",
      sample,
    );
  },
);

// GET ALL SAMPLES
export const getSamplesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const samples = await getSamples();

    return sendSuccess(
      res,
      200,
      "Samples fetched successfully",
      samples,
    );
  },
);

// GET SAMPLES BY APPOINTMENT TEST
export const getSamplesByAppointmentTestController = asyncHandler(
  async (req: Request, res: Response) => {
    const appointmentTestId = getParam(req, "appointmentTestId");

    const samples = await getSamplesByAppointmentTest(
      appointmentTestId,
    );

    return sendSuccess(
      res,
      200,
      "Appointment test samples fetched successfully",
      samples,
    );
  },
);

// GET SAMPLE BY ID
export const getSampleByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const sampleId = getParam(req, "sampleId");

    const sample = await getSampleById(sampleId);

    return sendSuccess(
      res,
      200,
      "Sample fetched successfully",
      sample,
    );
  },
);

// GET SAMPLE BY BARCODE
export const getSampleByBarcodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const barcode = getParam(req, "barcode");

    const sample = await getSampleByBarcode(barcode);

    return sendSuccess(
      res,
      200,
      "Sample fetched successfully",
      sample,
    );
  },
);

// GENERATE HOME COLLECTION OTP
// OTP is generated before samples are created.
export const generateCollectionOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const homeCollectionId = getParam(req, "homeCollectionId");

    if (!homeCollectionId) {
      return res.status(400).json({
        success: false,
        message: "homeCollectionId is required",
      });
    }

    const result = await generateHomeCollectionOtp(
      homeCollectionId,
      userId,
    );

    return sendSuccess(
      res,
      200,
      "Home collection OTP generated successfully",
      result,
    );
  },
);

// VERIFY HOME COLLECTION OTP - COLLECTOR ONLY
// Verification is reusable for all samples in this collection visit.
export const verifyCollectorCollectionOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const homeCollectionId = getParam(req, "homeCollectionId");
    const otp = getBodyString(req.body.otp);

    if (!homeCollectionId) {
      return res.status(400).json({
        success: false,
        message: "homeCollectionId is required",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "A valid 6-digit OTP is required",
      });
    }

    const result = await verifyCollectorHomeCollectionOtp(
      homeCollectionId,
      otp,
      userId,
    );

    return sendSuccess(
      res,
      200,
      "Home collection OTP verified successfully",
      result,
    );
  },
);

// GENERATE LAB HANDOVER OTP
export const generateSampleHandoverOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const labUserId = getUserId(req);
    const sampleId = getParam(req, "sampleId");

    const result = await generateSampleHandoverOtp(
      sampleId,
      labUserId,
    );

    return sendSuccess(
      res,
      200,
      "Sample handover OTP generated successfully",
      result,
    );
  },
);

// VERIFY LAB HANDOVER OTP - COLLECTOR
export const verifySampleHandoverOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const otp = getBodyString(req.body.otp);

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "A valid 6-digit OTP is required",
      });
    }

    const result = await verifySampleHandoverOtp(
      sampleId,
      otp,
      userId,
    );

    return sendSuccess(
      res,
      200,
      "Sample handed over to lab successfully",
      result,
    );
  },
);

// UPDATE SAMPLE - LAB WORKFLOW
export const updateSampleController = asyncHandler(
  async (req: Request, res: Response) => {
    getUserId(req);

    const sampleId = getParam(req, "sampleId");

    const {
      status,
      condition,
      rejectionReason,
      notes,
    } = req.body;

    const updatedSample = await updateSample(sampleId, {
      status,
      condition,
      rejectionReason,
      notes,
    });

    return sendSuccess(
      res,
      200,
      "Sample updated successfully",
      updatedSample,
    );
  },
);

// DELETE SAMPLE
export const deleteSampleController = asyncHandler(
  async (req: Request, res: Response) => {
    getUserId(req);

    const sampleId = getParam(req, "sampleId");

    const deletedSample = await deleteSample(sampleId);

    return sendSuccess(
      res,
      200,
      "Sample deleted successfully",
      deletedSample,
    );
  },
);

// COLLECTOR UPLOAD EVIDENCE
export const uploadCollectorSampleEvidenceController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sampleId = getParam(req, "sampleId");
    const file = req.file;
    const type = getBodyString(req.body.type);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Evidence file is required",
      });
    }

    if (
      type !== "COLLECTION_PHOTO" &&
      type !== "DELIVERY_PROOF"
    ) {
      await unlink(file.path).catch(() => undefined);

      return res.status(400).json({
        success: false,
        message: "Evidence type must be COLLECTION_PHOTO or DELIVERY_PROOF",
      });
    }

    try {
      const evidence = await uploadCollectorSampleEvidence(
        sampleId,
        userId,
        file,
        type,
      );

      return sendSuccess(
        res,
        201,
        "Sample evidence uploaded successfully",
        evidence,
      );
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
  },
);

// COLLECTOR UPDATE SAMPLE STATUS
export const updateCollectorSampleStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const sampleId = getParam(req, "sampleId");

    const {
      status,
      condition,
      rejectionReason,
      notes,
    } = req.body;

    if (status !== "COLLECTED" && status !== "IN_TRANSIT") {
      return res.status(400).json({
        success: false,
        message: "Collector can only set COLLECTED or IN_TRANSIT status",
      });
    }

    const updatedSample = await updateCollectorSampleStatus(
      sampleId,
      userId,
      {
        status,
        condition,
        rejectionReason,
        notes,
      },
    );

    return sendSuccess(
      res,
      200,
      "Collector sample status updated successfully",
      updatedSample,
    );
  },
);

// New descriptive aliases for route imports, if preferred.
export const generateHomeCollectionOtpController =
  generateCollectionOtpController;

export const verifyCollectorHomeCollectionOtpController =
  verifyCollectorCollectionOtpController;
