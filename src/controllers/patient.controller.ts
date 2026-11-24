import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requirePatientId } from "../utils/requirepatient";
import {
  getPatientAppointment,
  getPatientAppointmentReports,
  getPatientAppointments,
  getPatientHomeCollectionTracking,
  getPatientHomeCollection,
  getPatientHomeCollections,
  getPatientLabs,
  getPatientReportFile,
  getPatientScanCenters,
} from "../services/patient.service";
import {
  createPatientPaymentLink,
  processRazorpayWebhook,
} from "../services/razorpay.service";
import { apiError } from "../utils/apiError";
import { getTimeSlots } from "../services/timeslot.service";

const sendSuccess = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ status: "success", data });

export const getPatientLabsController = asyncHandler(async (_req, res) =>
  sendSuccess(res, await getPatientLabs()),
);

export const getPatientScanCentersController = asyncHandler(async (_req, res) =>
  sendSuccess(res, await getPatientScanCenters()),
);

export const getPatientTimeSlotsController = asyncHandler(async (req, res) => {
  const labId = typeof req.query.labId === "string" ? req.query.labId : undefined;
  const scanCenterId = typeof req.query.scanCenterId === "string" ? req.query.scanCenterId : undefined;
  const date = typeof req.query.date === "string" ? req.query.date : undefined;

  if ((!labId && !scanCenterId) || (labId && scanCenterId) || !date) {
    throw new apiError(400, "Provide one center ID and a date");
  }
  return sendSuccess(res, await getTimeSlots({ labId, scanCenterId, date, isAvailable: true }));
});

export const getPatientAppointmentsController = asyncHandler(async (req, res) =>
  sendSuccess(res, await getPatientAppointments(requirePatientId(req))),
);

export const getPatientHomeCollectionsController = asyncHandler(async (req, res) =>
  sendSuccess(res, await getPatientHomeCollections(requirePatientId(req))),
);

export const getPatientHomeCollectionHistoryController = asyncHandler(async (req, res) =>
  sendSuccess(res, await getPatientHomeCollections(requirePatientId(req), true)),
);

export const getPatientHomeCollectionController = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await getPatientHomeCollection(
      String(req.params.homeCollectionId),
      requirePatientId(req),
    ),
  ),
);

export const getPatientAppointmentController = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await getPatientAppointment(String(req.params.appointmentId), requirePatientId(req)),
  ),
);

export const getPatientAppointmentReportsController = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await getPatientAppointmentReports(String(req.params.appointmentId), requirePatientId(req)),
  ),
);

export const downloadPatientReportFileController = asyncHandler(async (req, res, next) => {
  const file = await getPatientReportFile(
    String(req.params.reportId),
    String(req.params.reportFileId),
    requirePatientId(req),
  );
  res.download(file.filePath, file.fileName, (error) => {
    if (error) next(error);
  });
});

export const getPatientHomeCollectionTrackingController = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await getPatientHomeCollectionTracking(
      String(req.params.homeCollectionId),
      requirePatientId(req),
    ),
  ),
);

export const createPatientPaymentLinkController = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await createPatientPaymentLink(
      String(req.params.appointmentId),
      requirePatientId(req),
    ),
    201,
  ),
);

export const razorpayWebhookController = asyncHandler(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    throw new apiError(400, "Razorpay webhook body is invalid");
  }
  const result = await processRazorpayWebhook(
    req.body,
    req.header("x-razorpay-signature") ?? "",
    req.header("x-razorpay-event-id") ?? undefined,
  );
  return res.status(200).json(result);
});

