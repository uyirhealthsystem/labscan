
import { Request, Response } from "express";

import {
  createCancellation,
  createReschedule,
  getCancellationByAppointmentId,
  getRescheduleById,
  getReschedulesByAppointment,
} from "../services/appointmentlifecycle.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// CANCELLATION
// =========================================================

export async function createCancellationController(
  req: Request,
  res: Response,
) {
  try {
    const {
      appointmentId,
      reason,
      additionalNotes,
      cancelledBy,
    } = req.body;

    if (!appointmentId || !reason) {
      return res.status(400).json({
        status: "error",
        message: "appointmentId and reason are required",
      });
    }

    const result = await createCancellation({
      appointmentId,
      reason,
      additionalNotes,
      cancelledBy,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Appointment cancelled successfully",
      data: await translateResponse(result, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel appointment",
    });
  }
}

export async function getCancellationByAppointmentIdController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;

    const cancellation =
      await getCancellationByAppointmentId(appointmentId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(cancellation, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Cancellation not found",
    });
  }
}

// =========================================================
// RESCHEDULE
// =========================================================

export async function createRescheduleController(
  req: Request,
  res: Response,
) {
  try {
    const {
      appointmentId,
      newDate,
      newStartTime,
      newEndTime,
      reason,
      rescheduledBy,
    } = req.body;

    if (
      !appointmentId ||
      !newDate ||
      !newStartTime ||
      !newEndTime
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "appointmentId, newDate, newStartTime and newEndTime are required",
      });
    }

    const result = await createReschedule({
      appointmentId,
      newDate,
      newStartTime,
      newEndTime,
      reason,
      rescheduledBy,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Appointment rescheduled successfully",
      data: await translateResponse(result, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to reschedule appointment",
    });
  }
}

export async function getReschedulesByAppointmentController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;

    const reschedules =
      await getReschedulesByAppointment(appointmentId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(reschedules, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch appointment reschedules",
    });
  }
}

export async function getRescheduleByIdController(
  req: Request<{ rescheduleId: string }>,
  res: Response,
) {
  try {
    const { rescheduleId } = req.params;

    const reschedule = await getRescheduleById(rescheduleId);

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(reschedule, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Reschedule not found",
    });
  }
}

