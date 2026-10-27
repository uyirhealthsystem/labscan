
import { prisma } from "./prisma.service";

// =========================================================
// REPORT
// =========================================================

export interface CreateReportInput {
  appointmentId: string;
  appointmentTestId?: string;
  status?: "PENDING" | "UPLOADED" | "SENT";
  reportNotes?: string;
  uploadedAt?: string;
  sentAt?: string;
  notifyPatient?: boolean;
}

export interface UpdateReportInput {
  status?: "PENDING" | "UPLOADED" | "SENT";
  reportNotes?: string;
  uploadedAt?: string;
  sentAt?: string;
  notifyPatient?: boolean;
}

export async function createReport(data: CreateReportInput) {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId: data.appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.appointmentType === "LAB" && !data.appointmentTestId) {
    throw new Error("appointmentTestId is required for LAB reports");
  }

  if (appointment.appointmentType === "SCAN" && data.appointmentTestId) {
    throw new Error("appointmentTestId must not be provided for SCAN reports");
  }

  if (data.appointmentTestId) {
    const appointmentTest = await prisma.appointmentTest.findUnique({
      where: { appointmentTestId: data.appointmentTestId },
    });

    if (
      !appointmentTest ||
      appointmentTest.appointmentId !== data.appointmentId
    ) {
      throw new Error("Appointment test not found for this appointment");
    }

    const existingReport = await prisma.report.findUnique({
      where: { appointmentTestId: data.appointmentTestId },
    });

    if (existingReport) {
      throw new Error("A report already exists for this appointment test");
    }
  } else {
    const existingReport = await prisma.report.findFirst({
      where: {
        appointmentId: data.appointmentId,
        appointmentTestId: null,
      },
    });

    if (existingReport) {
      throw new Error("Report already exists for this appointment");
    }
  }

  return prisma.report.create({
    data: {
      appointmentId: data.appointmentId,
      appointmentTestId: data.appointmentTestId,
      status: data.status,
      reportNotes: data.reportNotes,
      uploadedAt: data.uploadedAt
        ? new Date(data.uploadedAt)
        : undefined,
      sentAt: data.sentAt ? new Date(data.sentAt) : undefined,
      notifyPatient: data.notifyPatient,
    },
    include: {
      appointment: true,
      appointmentTest: true,
      files: true,
    },
  });
}

export async function getReports() {
  return prisma.report.findMany({
    include: {
      appointment: true,
      appointmentTest: true,
      files: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// =========================================================
// UPLOAD REPORT
// =========================================================

export const uploadReport = async (
  
  appointmentId: string,
  file: {
    originalname: string;
    filename: string;
    mimetype: string;
    size: number;
  },
  appointmentTestId?: string,
) => {
  console.log("SERVICE uploadReport received:", {
  appointmentId,
  appointmentTestId,
  hasAppointmentTestId: Boolean(appointmentTestId),
});
console.log("UPLOAD SERVICE DEBUG:", {
  appointmentId,
  appointmentTestId,
  type: typeof appointmentTestId,
});
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.appointmentType === "LAB" && !appointmentTestId) {
    throw new Error("appointmentTestId is required for LAB reports");
  }

  if (appointment.appointmentType === "SCAN" && appointmentTestId) {
    throw new Error("appointmentTestId must not be provided for SCAN reports");
  }

  return prisma.$transaction(async (tx) => {
    let reportId: string;

    if (appointmentTestId) {
      const appointmentTest = await tx.appointmentTest.findUnique({
        where: { appointmentTestId },
      });

      if (
        !appointmentTest ||
        appointmentTest.appointmentId !== appointmentId
      ) {
        throw new Error("Appointment test not found for this appointment");
      }

      if (appointmentTest.status === "COMPLETED") {
        throw new Error("This test is already completed");
      }

      const existingReport = await tx.report.findUnique({
        where: { appointmentTestId },
      });

      if (existingReport) {
        await tx.report.update({
          where: { reportId: existingReport.reportId },
          data: {
            status: "UPLOADED",
            uploadedAt: new Date(),
          },
        });

        reportId = existingReport.reportId;
      } else {
        const newReport = await tx.report.create({
          data: {
            appointmentId,
            appointmentTestId,
            status: "UPLOADED",
            uploadedAt: new Date(),
          },
        });

        reportId = newReport.reportId;
      }
    } else {
      // SCAN reports remain linked to the appointment, not a lab test.
      const existingReport = await tx.report.findFirst({
        where: {
          appointmentId,
          appointmentTestId: null,
        },
      });

      if (existingReport) {
        await tx.report.update({
          where: { reportId: existingReport.reportId },
          data: {
            status: "UPLOADED",
            uploadedAt: new Date(),
          },
        });

        reportId = existingReport.reportId;
      } else {
        const newReport = await tx.report.create({
          data: {
            appointmentId,
            status: "UPLOADED",
            uploadedAt: new Date(),
          },
        });

        reportId = newReport.reportId;
      }
    }

    const reportFile = await tx.reportFile.create({
      data: {
        reportId,
        fileName: file.originalname,
        fileUrl: `reports/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
      },
    });

    // Complete only the test whose report was uploaded.
    if (appointmentTestId) {
      await tx.appointmentTest.update({
        where: { appointmentTestId },
        data: { status: "COMPLETED" },
      });
    }

    const report = await tx.report.findUniqueOrThrow({
      where: { reportId },
      include: {
        appointment: true,
        appointmentTest: true,
        files: true,
      },
    });

    return {
      report,
      file: reportFile,
    };
  });
};

// =========================================================
// GET REPORT
// =========================================================

export async function getReportById(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { reportId },
    include: {
      appointment: true,
      appointmentTest: true,
      files: true,
    },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  return report;
}

export async function getReportByAppointment(
  appointmentId: string,
) {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // An appointment can now have multiple reports.
  return prisma.report.findMany({
    where: { appointmentId },
    include: {
      appointment: true,
      appointmentTest: true,
      files: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// =========================================================
// UPDATE REPORT
// =========================================================

export async function updateReport(
  reportId: string,
  data: UpdateReportInput,
) {
  const existingReport = await prisma.report.findUnique({
    where: { reportId },
  });

  if (!existingReport) {
    throw new Error("Report not found");
  }

  return prisma.report.update({
    where: { reportId },
    data: {
      status: data.status,
      reportNotes: data.reportNotes,
      uploadedAt: data.uploadedAt
        ? new Date(data.uploadedAt)
        : undefined,
      sentAt: data.sentAt ? new Date(data.sentAt) : undefined,
      notifyPatient: data.notifyPatient,
    },
    include: {
      appointment: true,
      appointmentTest: true,
      files: true,
    },
  });
}

export async function deleteReport(reportId: string) {
  const existingReport = await prisma.report.findUnique({
    where: { reportId },
  });

  if (!existingReport) {
    throw new Error("Report not found");
  }

  return prisma.report.delete({
    where: { reportId },
  });
}

// =========================================================
// REPORT FILE
// =========================================================

export interface CreateReportFileInput {
  reportId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export interface UpdateReportFileInput {
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
}

export async function createReportFile(
  data: CreateReportFileInput,
) {
  const report = await prisma.report.findUnique({
    where: { reportId: data.reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  return prisma.reportFile.create({
    data: {
      reportId: data.reportId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
    },
  });
}

export async function getReportFiles(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  return prisma.reportFile.findMany({
    where: { reportId },
    orderBy: {
      uploadedAt: "desc",
    },
  });
}

export async function getReportFileById(
  reportFileId: string,
) {
  const reportFile = await prisma.reportFile.findUnique({
    where: { reportFileId },
    include: {
      report: true,
    },
  });

  if (!reportFile) {
    throw new Error("Report file not found");
  }

  return reportFile;
}

export async function updateReportFile(
  reportFileId: string,
  data: UpdateReportFileInput,
) {
  const existingFile = await prisma.reportFile.findUnique({
    where: { reportFileId },
  });

  if (!existingFile) {
    throw new Error("Report file not found");
  }

  return prisma.reportFile.update({
    where: { reportFileId },
    data,
  });
}

export async function deleteReportFile(
  reportFileId: string,
) {
  const existingFile = await prisma.reportFile.findUnique({
    where: { reportFileId },
  });

  if (!existingFile) {
    throw new Error("Report file not found");
  }

  return prisma.reportFile.delete({
    where: { reportFileId },
  });
}

// =========================================================
// EARNING
// =========================================================

export interface CreateEarningInput {
  appointmentId: string;
  amount: number | string;
  status?: "PENDING" | "EARNED" | "PAID";
  earnedAt?: string;
}

export interface UpdateEarningInput {
  amount?: number | string;
  status?: "PENDING" | "EARNED" | "PAID";
  earnedAt?: string;
}

export async function createEarning(
  data: CreateEarningInput,
) {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId: data.appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const existingEarning = await prisma.earning.findUnique({
    where: { appointmentId: data.appointmentId },
  });

  if (existingEarning) {
    throw new Error("Earning already exists for this appointment");
  }

  return prisma.earning.create({
    data: {
      appointmentId: data.appointmentId,
      amount: data.amount,
      status: data.status,
      earnedAt: data.earnedAt
        ? new Date(data.earnedAt)
        : undefined,
    },
    include: {
      appointment: true,
    },
  });
}

export async function getEarnings() {
  return prisma.earning.findMany({
    include: {
      appointment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export const getEarningsSummary = async () => {
  const earnings = await prisma.earning.findMany({
    select: {
      amount: true,
      status: true,
    },
  });

  let totalEarnings = 0;
  let completedEarnings = 0;
  let pendingEarnings = 0;

  for (const earning of earnings) {
    const amount = Number(earning.amount);

    totalEarnings += amount;

    if (earning.status === "PENDING") {
      pendingEarnings += amount;
    }

    if (
      earning.status === "EARNED" ||
      earning.status === "PAID"
    ) {
      completedEarnings += amount;
    }
  }

  return {
    totalEarnings,
    completedEarnings,
    pendingEarnings,
  };
};

export async function getEarningById(
  earningId: string,
) {
  const earning = await prisma.earning.findUnique({
    where: { earningId },
    include: {
      appointment: true,
    },
  });

  if (!earning) {
    throw new Error("Earning not found");
  }

  return earning;
}

export async function getEarningByAppointment(
  appointmentId: string,
) {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const earning = await prisma.earning.findUnique({
    where: { appointmentId },
    include: {
      appointment: true,
    },
  });

  if (!earning) {
    throw new Error("Earning not found");
  }

  return earning;
}

export async function updateEarning(
  earningId: string,
  data: UpdateEarningInput,
) {
  const existingEarning = await prisma.earning.findUnique({
    where: { earningId },
  });

  if (!existingEarning) {
    throw new Error("Earning not found");
  }

  return prisma.earning.update({
    where: { earningId },
    data: {
      amount: data.amount,
      status: data.status,
      earnedAt: data.earnedAt
        ? new Date(data.earnedAt)
        : undefined,
    },
  });
}

export async function deleteEarning(
  earningId: string,
) {
  const existingEarning = await prisma.earning.findUnique({
    where: { earningId },
  });

  if (!existingEarning) {
    throw new Error("Earning not found");
  }

  return prisma.earning.delete({
    where: { earningId },
  });
}
