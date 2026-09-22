
import { Request, Response } from "express";

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
} from "../services/sample.service";

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

    return res.status(201).json({
      status: "success",
      data: sample,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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

    return res.status(200).json({
      status: "success",
      data: samples,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// =========================================================
// GET SAMPLES BY APPOINTMENT TEST
// =========================================================

export const getSamplesByAppointmentTestController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const appointmentTestId = String(
        req.params.appointmentTestId,
      );

      const samples =
        await getSamplesByAppointmentTest(
          appointmentTestId,
        );

      return res.status(200).json({
        status: "success",
        data: samples,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  };

// =========================================================
// GET SAMPLE BY BARCODE
// =========================================================

export const getSampleByBarcodeController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const barcode = String(req.params.barcode);

      const sample =
        await getSampleByBarcode(barcode);

      return res.status(200).json({
        status: "success",
        data: sample,
      });
    } catch (error: any) {
      return res.status(404).json({
        status: "error",
        message: error.message,
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

    return res.status(200).json({
      status: "success",
      data: sample,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
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

    // IMPORTANT:
    // collectedAt and receivedAt are intentionally NOT
    // accepted from the client.
    //
    // Backend automatically generates:
    // collectedAt -> when status becomes COLLECTED
    // receivedAt  -> when status becomes RECEIVED

    const sample = await updateSample(
      sampleId,
      {
        status,
        condition,
        rejectionReason,
        notes,
      },
    );

    return res.status(200).json({
      status: "success",
      data: sample,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// =========================================================
// GENERATE COLLECTION OTP
// =========================================================

export const generateCollectionOtpController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const sampleId = String(
        req.params.sampleId,
      );

      const result =
        await generateCollectionOtp(sampleId);

      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  };

// =========================================================
// VERIFY COLLECTION OTP
// =========================================================

export const verifyCollectionOtpController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const sampleId = String(
        req.params.sampleId,
      );

      const { otp } = req.body;

      if (!otp) {
        return res.status(400).json({
          status: "error",
          message: "OTP is required",
        });
      }

      const result =
        await verifyCollectionOtp(
          sampleId,
          String(otp),
        );

      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  };

