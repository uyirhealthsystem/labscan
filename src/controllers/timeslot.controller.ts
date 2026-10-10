
import { Request, Response } from "express";

import {
  createTimeSlot,
  getTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} from "../services/timeslot.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

export const createTimeSlotController = async (
  req: Request,
  res: Response,
) => {
  try {
    const timeSlot = await createTimeSlot(req.body);
    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Time slot created successfully",
      data: await translateResponse(timeSlot, language),
    });
  } catch (error: unknown) {
    console.error("Create time slot error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create time slot",
    });
  }
};

export const getTimeSlotsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const labId = req.query.labId as string | undefined;
    const scanCenterId =
      req.query.scanCenterId as string | undefined;
    const date = req.query.date as string | undefined;

    let isAvailable: boolean | undefined;

    if (req.query.isAvailable !== undefined) {
      isAvailable = req.query.isAvailable === "true";
    }

    const timeSlots = await getTimeSlots({
      labId,
      scanCenterId,
      date,
      isAvailable,
    });

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(timeSlots, language),
    });
  } catch (error: unknown) {
    console.error("Get time slots error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get time slots",
    });
  }
};

export const getTimeSlotByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const timeSlotId = req.params.timeSlotId as string;

    const timeSlot = await getTimeSlotById(timeSlotId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(timeSlot, language),
    });
  } catch (error: unknown) {
    console.error("Get time slot error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to get time slot";

    if (message === "Time slot not found") {
      return res.status(404).json({
        status: "error",
        message,
      });
    }

    return res.status(400).json({
      status: "error",
      message,
    });
  }
};

export const updateTimeSlotController = async (
  req: Request,
  res: Response,
) => {
  try {
    const timeSlotId = req.params.timeSlotId as string;

    const timeSlot = await updateTimeSlot(
      timeSlotId,
      req.body,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Time slot updated successfully",
      data: await translateResponse(timeSlot, language),
    });
  } catch (error: unknown) {
    console.error("Update time slot error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update time slot";

    if (message === "Time slot not found") {
      return res.status(404).json({
        status: "error",
        message,
      });
    }

    return res.status(400).json({
      status: "error",
      message,
    });
  }
};

export const deleteTimeSlotController = async (
  req: Request,
  res: Response,
) => {
  try {
    const timeSlotId = req.params.timeSlotId as string;

    await deleteTimeSlot(timeSlotId);

    return res.status(200).json({
      status: "success",
      message: "Time slot deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Delete time slot error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete time slot";

    if (message === "Time slot not found") {
      return res.status(404).json({
        status: "error",
        message,
      });
    }

    return res.status(400).json({
      status: "error",
      message,
    });
  }
};

