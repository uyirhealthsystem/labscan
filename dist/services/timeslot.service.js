"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTimeSlot = exports.updateTimeSlot = exports.getTimeSlotById = exports.getTimeSlots = exports.createTimeSlot = void 0;
const prisma_service_1 = require("./prisma.service");
const createTimeSlot = async (data) => {
    if (!data.labId && !data.scanCenterId) {
        throw new Error("Either labId or scanCenterId is required");
    }
    if (data.labId && data.scanCenterId) {
        throw new Error("Provide either labId or scanCenterId, not both");
    }
    const date = new Date(data.date);
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
    }
    if (isNaN(startTime.getTime())) {
        throw new Error("Invalid startTime");
    }
    if (isNaN(endTime.getTime())) {
        throw new Error("Invalid endTime");
    }
    if (startTime >= endTime) {
        throw new Error("endTime must be after startTime");
    }
    if (data.labId) {
        const lab = await prisma_service_1.prisma.lab.findUnique({
            where: {
                labId: data.labId,
            },
        });
        if (!lab) {
            throw new Error("Lab not found");
        }
        if (lab.status !== "ACTIVE") {
            throw new Error("Lab is inactive");
        }
    }
    if (data.scanCenterId) {
        const scanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
            where: {
                scanCenterId: data.scanCenterId,
            },
        });
        if (!scanCenter) {
            throw new Error("Scan center not found");
        }
        if (scanCenter.status !== "ACTIVE") {
            throw new Error("Scan center is inactive");
        }
    }
    // Check overlapping slot
    const overlappingSlot = await prisma_service_1.prisma.timeSlot.findFirst({
        where: {
            ...(data.labId
                ? { labId: data.labId }
                : { scanCenterId: data.scanCenterId }),
            date,
            startTime: {
                lt: endTime,
            },
            endTime: {
                gt: startTime,
            },
        },
    });
    if (overlappingSlot) {
        throw new Error("Time slot overlaps with an existing slot");
    }
    return prisma_service_1.prisma.timeSlot.create({
        data: {
            labId: data.labId,
            scanCenterId: data.scanCenterId,
            date,
            startTime,
            endTime,
            isAvailable: data.isAvailable ?? true,
        },
    });
};
exports.createTimeSlot = createTimeSlot;
const getTimeSlots = async (filters) => {
    if (filters?.labId && filters?.scanCenterId) {
        throw new Error("Provide either labId or scanCenterId, not both");
    }
    return prisma_service_1.prisma.timeSlot.findMany({
        where: {
            ...(filters?.labId
                ? { labId: filters.labId }
                : filters?.scanCenterId
                    ? { scanCenterId: filters.scanCenterId }
                    : {}),
            ...(filters?.date
                ? {
                    date: new Date(filters.date),
                }
                : {}),
            ...(filters?.isAvailable !== undefined
                ? {
                    isAvailable: filters.isAvailable,
                }
                : {}),
        },
        orderBy: [
            {
                date: "asc",
            },
            {
                startTime: "asc",
            },
        ],
    });
};
exports.getTimeSlots = getTimeSlots;
const getTimeSlotById = async (timeSlotId) => {
    const timeSlot = await prisma_service_1.prisma.timeSlot.findUnique({
        where: {
            timeSlotId,
        },
    });
    if (!timeSlot) {
        throw new Error("Time slot not found");
    }
    return timeSlot;
};
exports.getTimeSlotById = getTimeSlotById;
const updateTimeSlot = async (timeSlotId, data) => {
    const existingSlot = await prisma_service_1.prisma.timeSlot.findUnique({
        where: {
            timeSlotId,
        },
    });
    if (!existingSlot) {
        throw new Error("Time slot not found");
    }
    const date = data.date
        ? new Date(data.date)
        : existingSlot.date;
    const startTime = data.startTime
        ? new Date(data.startTime)
        : existingSlot.startTime;
    const endTime = data.endTime
        ? new Date(data.endTime)
        : existingSlot.endTime;
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
    }
    if (isNaN(startTime.getTime())) {
        throw new Error("Invalid startTime");
    }
    if (isNaN(endTime.getTime())) {
        throw new Error("Invalid endTime");
    }
    if (startTime >= endTime) {
        throw new Error("endTime must be after startTime");
    }
    const overlappingSlot = await prisma_service_1.prisma.timeSlot.findFirst({
        where: {
            timeSlotId: {
                not: timeSlotId,
            },
            ...(existingSlot.labId
                ? { labId: existingSlot.labId }
                : { scanCenterId: existingSlot.scanCenterId }),
            date,
            startTime: {
                lt: endTime,
            },
            endTime: {
                gt: startTime,
            },
        },
    });
    if (overlappingSlot) {
        throw new Error("Time slot overlaps with an existing slot");
    }
    return prisma_service_1.prisma.timeSlot.update({
        where: {
            timeSlotId,
        },
        data: {
            date,
            startTime,
            endTime,
            ...(data.isAvailable !== undefined
                ? { isAvailable: data.isAvailable }
                : {}),
        },
    });
};
exports.updateTimeSlot = updateTimeSlot;
const deleteTimeSlot = async (timeSlotId) => {
    const existingSlot = await prisma_service_1.prisma.timeSlot.findUnique({
        where: {
            timeSlotId,
        },
    });
    if (!existingSlot) {
        throw new Error("Time slot not found");
    }
    return prisma_service_1.prisma.timeSlot.delete({
        where: {
            timeSlotId,
        },
    });
};
exports.deleteTimeSlot = deleteTimeSlot;
//# sourceMappingURL=timeslot.service.js.map