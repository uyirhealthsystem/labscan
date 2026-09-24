import { prisma } from "./prisma.service";

export interface CreateTimeSlotInput {
  labId?: string;
  scanCenterId?: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface UpdateTimeSlotInput {
  date?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export const createTimeSlot = async (data: CreateTimeSlotInput) => {
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
    const lab = await prisma.lab.findUnique({
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
    const scanCenter = await prisma.scanCenter.findUnique({
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
  const overlappingSlot = await prisma.timeSlot.findFirst({
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

  return prisma.timeSlot.create({
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

export const getTimeSlots = async (filters?: {
  labId?: string;
  scanCenterId?: string;
  date?: string;
  isAvailable?: boolean;
}) => {
  if (filters?.labId && filters?.scanCenterId) {
    throw new Error("Provide either labId or scanCenterId, not both");
  }

  return prisma.timeSlot.findMany({
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

export const getTimeSlotById = async (timeSlotId: string) => {
  const timeSlot = await prisma.timeSlot.findUnique({
    where: {
      timeSlotId,
    },
  });

  if (!timeSlot) {
    throw new Error("Time slot not found");
  }

  return timeSlot;
};

export const updateTimeSlot = async (
  timeSlotId: string,
  data: UpdateTimeSlotInput,
) => {
  const existingSlot = await prisma.timeSlot.findUnique({
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

  const overlappingSlot = await prisma.timeSlot.findFirst({
    where: {
      timeSlotId: {
        not: timeSlotId,
      },

      ...(existingSlot.labId
        ? { labId: existingSlot.labId }
        : { scanCenterId: existingSlot.scanCenterId! }),

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

  return prisma.timeSlot.update({
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

export const deleteTimeSlot = async (timeSlotId: string) => {
  const existingSlot = await prisma.timeSlot.findUnique({
    where: {
      timeSlotId,
    },
  });

  if (!existingSlot) {
    throw new Error("Time slot not found");
  }

  return prisma.timeSlot.delete({
    where: {
      timeSlotId,
    },
  });
};