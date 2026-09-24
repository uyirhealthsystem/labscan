import { Request, Response } from "express";

import {
  createTimeSlot,
  getTimeSlots,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} from "../services/timeslot.service";

export const createTimeSlotController = async (
  req: Request,
  res: Response,
) => {
  try {
    const timeSlot = await createTimeSlot(req.body);

    return res.status(201).json({
      status: "success",
      message: "Time slot created successfully",
      data: timeSlot,
    });
  } catch (error: any) {
    console.error("Create time slot error:", error);

    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to create time slot",
    });
  }
};

export const getTimeSlotsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const labId = req.query.labId as string | undefined;
    const scanCenterId = req.query.scanCenterId as string | undefined;
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

    return res.status(200).json({
      status: "success",
      data: timeSlots,
    });
  } catch (error: any) {
    console.error("Get time slots error:", error);

    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to get time slots",
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

    return res.status(200).json({
      status: "success",
      data: timeSlot,
    });
  } catch (error: any) {
    console.error("Get time slot error:", error);

    if (error.message === "Time slot not found") {
      return res.status(404).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to get time slot",
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

    return res.status(200).json({
      status: "success",
      message: "Time slot updated successfully",
      data: timeSlot,
    });
  } catch (error: any) {
    console.error("Update time slot error:", error);

    if (error.message === "Time slot not found") {
      return res.status(404).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to update time slot",
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
  } catch (error: any) {
    console.error("Delete time slot error:", error);

    if (error.message === "Time slot not found") {
      return res.status(404).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to delete time slot",
    });
  }
};