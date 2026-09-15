import { Request, Response } from "express";

import {
  createCancellation,
  createReschedule,
  getCancellationByAppointmentId,
  getRescheduleById,
  getReschedulesByAppointment,
} from "../services/appointmentlifecycle.service";

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
        message:
          "appointmentId and reason are required",
      });
    }

    const result = await createCancellation({
      appointmentId,
      reason,
      additionalNotes,
      cancelledBy,
    });

    return res.status(201).json({
      status: "success",
      message: "Appointment cancelled successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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
      await getCancellationByAppointmentId(
        appointmentId,
      );

    return res.status(200).json({
      status: "success",
      data: cancellation,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
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

    return res.status(201).json({
      status: "success",
      message: "Appointment rescheduled successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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
      await getReschedulesByAppointment(
        appointmentId,
      );

    return res.status(200).json({
      status: "success",
      data: reschedules,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getRescheduleByIdController(
  req: Request<{ rescheduleId: string }>,
  res: Response,
) {
  try {
    const { rescheduleId } = req.params;

    const reschedule =
      await getRescheduleById(rescheduleId);

    return res.status(200).json({
      status: "success",
      data: reschedule,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}