"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTimeSlotController = exports.updateTimeSlotController = exports.getTimeSlotByIdController = exports.getTimeSlotsController = exports.createTimeSlotController = void 0;
const timeslot_service_1 = require("../services/timeslot.service");
const translate_response_1 = require("../utils/translate.response");
const createTimeSlotController = async (req, res) => {
    try {
        const timeSlot = await (0, timeslot_service_1.createTimeSlot)(req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Time slot created successfully",
            data: await (0, translate_response_1.translateResponse)(timeSlot, language),
        });
    }
    catch (error) {
        console.error("Create time slot error:", error);
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create time slot",
        });
    }
};
exports.createTimeSlotController = createTimeSlotController;
const getTimeSlotsController = async (req, res) => {
    try {
        const labId = req.query.labId;
        const scanCenterId = req.query.scanCenterId;
        const date = req.query.date;
        let isAvailable;
        if (req.query.isAvailable !== undefined) {
            isAvailable = req.query.isAvailable === "true";
        }
        const timeSlots = await (0, timeslot_service_1.getTimeSlots)({
            labId,
            scanCenterId,
            date,
            isAvailable,
        });
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(timeSlots, language),
        });
    }
    catch (error) {
        console.error("Get time slots error:", error);
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to get time slots",
        });
    }
};
exports.getTimeSlotsController = getTimeSlotsController;
const getTimeSlotByIdController = async (req, res) => {
    try {
        const timeSlotId = req.params.timeSlotId;
        const timeSlot = await (0, timeslot_service_1.getTimeSlotById)(timeSlotId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(timeSlot, language),
        });
    }
    catch (error) {
        console.error("Get time slot error:", error);
        const message = error instanceof Error ? error.message : "Failed to get time slot";
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
exports.getTimeSlotByIdController = getTimeSlotByIdController;
const updateTimeSlotController = async (req, res) => {
    try {
        const timeSlotId = req.params.timeSlotId;
        const timeSlot = await (0, timeslot_service_1.updateTimeSlot)(timeSlotId, req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Time slot updated successfully",
            data: await (0, translate_response_1.translateResponse)(timeSlot, language),
        });
    }
    catch (error) {
        console.error("Update time slot error:", error);
        const message = error instanceof Error
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
exports.updateTimeSlotController = updateTimeSlotController;
const deleteTimeSlotController = async (req, res) => {
    try {
        const timeSlotId = req.params.timeSlotId;
        await (0, timeslot_service_1.deleteTimeSlot)(timeSlotId);
        return res.status(200).json({
            status: "success",
            message: "Time slot deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete time slot error:", error);
        const message = error instanceof Error
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
exports.deleteTimeSlotController = deleteTimeSlotController;
//# sourceMappingURL=timeslot.controller.js.map