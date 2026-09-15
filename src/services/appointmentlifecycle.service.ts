import { prisma } from "./prisma.service";

export interface CreateCancellationInput {
  appointmentId: string;
  reason:
    | "PATIENT_REQUESTED"
    | "PATIENT_NOT_AVAILABLE"
    | "INCORRECT_BOOKING_DETAILS"
    | "EQUIPMENT_ISSUE"
    | "OTHER";
  additionalNotes?: string;
  cancelledBy?: string;
}

export interface CreateRescheduleInput {
  appointmentId: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason?: string;
  rescheduledBy?: string;
}

// =========================================================
// CANCELLATION
// =========================================================

export async function createCancellation(
  data: CreateCancellationInput,
) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      appointmentId: data.appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.status === "CANCELLED") {
    throw new Error("Appointment is already cancelled");
  }

  const existingCancellation =
    await prisma.cancellation.findUnique({
      where: {
        appointmentId: data.appointmentId,
      },
    });

  if (existingCancellation) {
    throw new Error(
      "Cancellation already exists for this appointment",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const cancellation = await tx.cancellation.create({
      data: {
        appointmentId: data.appointmentId,
        reason: data.reason,
        additionalNotes: data.additionalNotes,
        cancelledBy: data.cancelledBy,
      },
    });

    const appointment = await tx.appointment.update({
      where: {
        appointmentId: data.appointmentId,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return {
      cancellation,
      appointment,
    };
  });

  return result;
}

export async function getCancellationByAppointmentId(
  appointmentId: string,
) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const cancellation =
    await prisma.cancellation.findUnique({
      where: {
        appointmentId,
      },
    });

  if (!cancellation) {
    throw new Error(
      "Cancellation not found for this appointment",
    );
  }

  return cancellation;
}

// =========================================================
// RESCHEDULE
// =========================================================

export async function createReschedule(
  data: CreateRescheduleInput,
) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      appointmentId: data.appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.status === "CANCELLED") {
    throw new Error(
      "Cancelled appointment cannot be rescheduled",
    );
  }

  const newDate = new Date(data.newDate);
  const newStartTime = new Date(data.newStartTime);
  const newEndTime = new Date(data.newEndTime);

  if (
    Number.isNaN(newDate.getTime()) ||
    Number.isNaN(newStartTime.getTime()) ||
    Number.isNaN(newEndTime.getTime())
  ) {
    throw new Error("Invalid reschedule date or time");
  }

  if (newEndTime <= newStartTime) {
    throw new Error(
      "newEndTime must be after newStartTime",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const reschedule = await tx.reschedule.create({
      data: {
        appointmentId: data.appointmentId,

        oldDate: appointment.appointmentDate,
        oldStartTime: appointment.startTime,
        oldEndTime: appointment.endTime,

        newDate,
        newStartTime,
        newEndTime,

        reason: data.reason,
        rescheduledBy: data.rescheduledBy,
      },
    });

    const updatedAppointment =
      await tx.appointment.update({
        where: {
          appointmentId: data.appointmentId,
        },
        data: {
          appointmentDate: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          status: "RESCHEDULED",
        },
      });

    return {
      reschedule,
      appointment: updatedAppointment,
    };
  });

  return result;
}

export async function getReschedulesByAppointment(
  appointmentId: string,
) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return prisma.reschedule.findMany({
    where: {
      appointmentId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRescheduleById(
  rescheduleId: string,
) {
  const reschedule = await prisma.reschedule.findUnique({
    where: {
      rescheduleId,
    },
    include: {
      appointment: true,
    },
  });

  if (!reschedule) {
    throw new Error("Reschedule not found");
  }

  return reschedule;
}