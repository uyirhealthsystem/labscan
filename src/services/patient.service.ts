import path from "node:path";
import { prisma } from "./prisma.service";
import { apiError } from "../utils/apiError";

const patientAppointmentInclude = {
  lab: {
    select: { labId: true, name: true, address: true, phone: true },
  },
  scanCenter: {
    select: { scanCenterId: true, name: true, address: true, phone: true },
  },
  tests: {
    include: {
      labTest: { include: { testCatalog: true } },
    },
  },
  services: {
    include: {
      scanService: { include: { serviceCatalog: true } },
      equipment: true,
    },
  },
  homeCollection: true,
  payments: {
    orderBy: { createdAt: "desc" },
    select: {
      paymentId: true,
      status: true,
      amount: true,
      currency: true,
      checkoutUrl: true,
      expiresAt: true,
      paidAt: true,
      createdAt: true,
    },
  },
} as const;

export async function getPatientLabs() {
  return prisma.lab.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      labId: true,
      name: true,
      phone: true,
      address: true,
      districtId: true,
      tests: {
        where: {
          status: "ACTIVE",
          testCatalog: { status: "ACTIVE" },
        },
        orderBy: { createdAt: "desc" },
        select: {
          labTestId: true,
          price: true,
          turnaroundTime: true,
          testCatalog: {
            select: {
              testCatalogId: true,
              code: true,
              name: true,
              description: true,
              category: true,
              sampleType: true,
              fastingRequirement: true,
              fastingHours: true,
              preparationInstructions: true,
            },
          },
        },
      },
    },
  });
}

export async function getPatientScanCenters() {
  return prisma.scanCenter.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      scanCenterId: true,
      name: true,
      phone: true,
      address: true,
      districtId: true,
      services: {
        where: {
          status: "ACTIVE",
          serviceCatalog: { status: "ACTIVE" },
        },
        orderBy: { createdAt: "desc" },
        select: {
          scanServiceId: true,
          price: true,
          turnaroundTime: true,
          equipmentRequired: true,
          homeServiceAvailable: true,
          serviceCatalog: {
            select: {
              serviceCatalogId: true,
              code: true,
              name: true,
              description: true,
              category: true,
            },
          },
        },
      },
    },
  });
}

export function getPatientAppointments(patientId: string) {
  return prisma.appointment.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: patientAppointmentInclude,
  });
}

export async function getPatientHomeCollections(patientId: string, history = false) {
  const appointments = await getPatientAppointments(patientId);
  const bookings = appointments.filter((appointment) => {
    if (appointment.appointmentMode !== "HOME" || !appointment.homeCollection) {
      return false;
    }
    return history
      ? ["COMPLETED", "CANCELLED"].includes(appointment.homeCollection.status)
      : !["COMPLETED", "CANCELLED"].includes(appointment.homeCollection.status);
  });
  return { total: bookings.length, bookings };
}

export async function getPatientHomeCollection(homeCollectionId: string, patientId: string) {
  const homeCollection = await prisma.homeCollection.findFirst({
    where: {
      homeCollectionId,
      appointment: { patientId },
    },
    select: { appointmentId: true },
  });

  if (!homeCollection) {
    throw new apiError(404, "Home collection not found");
  }
  return getPatientAppointment(homeCollection.appointmentId, patientId);
}

export async function getPatientAppointment(appointmentId: string, patientId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { appointmentId, patientId },
    include: patientAppointmentInclude,
  });

  if (!appointment) {
    throw new apiError(404, "Appointment not found");
  }
  return appointment;
}

export async function getPatientAppointmentReports(appointmentId: string, patientId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { appointmentId, patientId },
    select: { appointmentId: true },
  });

  if (!appointment) {
    throw new apiError(404, "Appointment not found");
  }

  const reports = await prisma.report.findMany({
    where: { appointmentId },
    orderBy: { createdAt: "desc" },
    include: {
      appointmentTest: {
        select: {
          appointmentTestId: true,
          labTest: { select: { testCatalog: { select: { name: true } } } },
        },
      },
      files: {
        select: {
          reportFileId: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  return reports.map((report) => ({
    ...report,
    files: report.files.map((file) => ({
      ...file,
      downloadPath: `/api/v1/labscan/patient/reports/${report.reportId}/files/${file.reportFileId}`,
    })),
  }));
}

export async function getPatientReportFile(reportId: string, reportFileId: string, patientId: string) {
  const file = await prisma.reportFile.findFirst({
    where: {
      reportFileId,
      reportId,
      report: {
        appointment: { patientId },
      },
    },
    select: {
      fileName: true,
      fileType: true,
      fileUrl: true,
    },
  });

  if (!file) {
    throw new apiError(404, "Report file not found");
  }

  const filePath = path.resolve(process.cwd(), "uploads", "reports", path.basename(file.fileUrl));
  const reportsDirectory = path.resolve(process.cwd(), "uploads", "reports");
  if (!filePath.startsWith(`${reportsDirectory}${path.sep}`)) {
    throw new apiError(404, "Report file not found");
  }

  return { ...file, filePath };
}

export async function getPatientHomeCollectionTracking(homeCollectionId: string, patientId: string) {
  const homeCollection = await prisma.homeCollection.findFirst({
    where: {
      homeCollectionId,
      appointment: { patientId },
    },
    include: {
      trackingEvents: { orderBy: { createdAt: "asc" } },
      collectorAssignment: {
        include: {
          collector: {
            select: {
              name: true,
              phone: true,
              latitude: true,
              longitude: true,
              lastLocationAt: true,
            },
          },
        },
      },
    },
  });

  if (!homeCollection) {
    throw new apiError(404, "Home collection not found");
  }

  const collectionActive = !["COMPLETED", "CANCELLED"].includes(homeCollection.status);
  const collector = collectionActive ? homeCollection.collectorAssignment?.collector ?? null : null;

  return {
    homeCollectionId: homeCollection.homeCollectionId,
    status: homeCollection.status,
    assignedAt: homeCollection.assignedAt,
    collectedAt: homeCollection.collectedAt,
    trackingEvents: homeCollection.trackingEvents,
    collector: collector
      ? {
          name: collector.name,
          phone: collector.phone,
          location:
            collector.latitude !== null && collector.longitude !== null
              ? { latitude: collector.latitude, longitude: collector.longitude, updatedAt: collector.lastLocationAt }
              : null,
        }
      : null,
  };
}

