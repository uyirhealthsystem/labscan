import { prisma } from "./prisma.service";

// =========================================================
// INPUT TYPES
// =========================================================

export interface CreateHomeCollectionInput {
  appointmentId: string;
  address: string;
  specialInstructions?: string;
  status?: HomeCollectionStatus;
}

export interface UpdateHomeCollectionInput {
  address?: string;
  specialInstructions?: string;
  status?: HomeCollectionStatus;
  assignedAt?: string;
  collectedAt?: string;
  completedAt?: string;
}

export interface CreateCollectorInput {
  labId: string;
  name: string;
  phone?: string;
  role?: "NURSE" | "TECHNICIAN";
  qualification?: string;
  qualificationNumber?: string;
  qualificationProofUrl?: string;
  qualificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateCollectorInput {
  name?: string;
  phone?: string;
  role?: "NURSE" | "TECHNICIAN";
  qualification?: string;
  qualificationNumber?: string;
  qualificationProofUrl?: string;
  qualificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  status?: "ACTIVE" | "INACTIVE";
}

export interface CreateCollectorAssignmentInput {
  homeCollectionId: string;
  collectorId: string;
}

export interface UpdateCollectorAssignmentInput {
  status?: "ASSIGNED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";
}

export interface CreateHomeCollectionTrackingInput {
  homeCollectionId: string;
  status: Exclude<HomeCollectionStatus, "PENDING" | "CANCELLED">;
  notes?: string;
}

// =========================================================
// STATUS VALIDATION
// =========================================================

export type HomeCollectionStatus =
  | "PENDING"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "SAMPLE_COLLECTED"
  | "IN_LAB"
  | "PROCESSING"
  | "REPORT_READY"
  | "COMPLETED"
  | "CANCELLED";

type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";

const allowedTransitions: Record<HomeCollectionStatus, HomeCollectionStatus[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["SAMPLE_COLLECTED", "CANCELLED"],
  SAMPLE_COLLECTED: ["IN_LAB", "CANCELLED"],
  IN_LAB: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["REPORT_READY", "CANCELLED"],
  REPORT_READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function validateHomeCollectionTransition(current: HomeCollectionStatus, next: HomeCollectionStatus) {
  if (current === next) return;
  if (!allowedTransitions[current]?.includes(next)) {
    throw new Error(`Invalid home collection status transition: ${current} -> ${next}`);
  }
}

function getHomeCollectionTimestamps(status: HomeCollectionStatus) {
  const now = new Date();
  return {
    ...(status === "ASSIGNED" ? { assignedAt: now } : {}),
    ...(status === "SAMPLE_COLLECTED" ? { collectedAt: now } : {}),
    ...(status === "COMPLETED" ? { completedAt: now } : {}),
  };
}

function assertAppointmentCanHaveHomeCollection(status: string) {
  if (["CANCELLED", "COMPLETED", "RESCHEDULED"].includes(status)) {
    throw new Error(`Cannot create home collection for an appointment with status ${status}`);
  }
}

// Keep the collection status and tracking history in sync. PENDING and CANCELLED
// are not accepted by the current tracking input/schema, so they are not inserted
// as tracking events here.
async function updateCollectionStatus(
  tx: any,
  homeCollectionId: string,
  currentStatus: HomeCollectionStatus,
  nextStatus: HomeCollectionStatus,
  notes?: string,
) {
  if (currentStatus !== nextStatus) {
    validateHomeCollectionTransition(currentStatus, nextStatus);
  }

  const updated = await tx.homeCollection.update({
    where: { homeCollectionId },
    data: {
      status: nextStatus,
      ...getHomeCollectionTimestamps(nextStatus),
    },
  });

  if (currentStatus !== nextStatus && nextStatus !== "PENDING" && nextStatus !== "CANCELLED") {
    await tx.homeCollectionTracking.create({
      data: { homeCollectionId, status: nextStatus, notes },
    });
  }
  return updated;
}

// Shared includes keep the per-test report and its files visible in collection APIs.
const appointmentWithLabAndTestReports = {
  include: {
    lab: true,
    tests: {
      include: {
        labTest: { include: { testCatalog: true } },
        samples: true,
        report: { include: { files: true } },
      },
    },
    services: {
      include: {
        scanService: { include: { serviceCatalog: true } },
      },
    },
    reports: { include: { files: true, appointmentTest: true } },
  },
} as const;

// =========================================================
// HOME COLLECTION
// =========================================================

export async function createHomeCollection(data: CreateHomeCollectionInput) {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId: data.appointmentId },
  });
  if (!appointment) throw new Error("Appointment not found");
  if (appointment.appointmentType !== "LAB") {
    throw new Error("Home collection is only available for LAB appointments");
  }
  if (appointment.appointmentMode !== "HOME") {
    throw new Error("Home collection can only be created for HOME appointments");
  }
  assertAppointmentCanHaveHomeCollection(appointment.status);

  const existing = await prisma.homeCollection.findUnique({
    where: { appointmentId: data.appointmentId },
  });
  if (existing) throw new Error("Home collection already exists for this appointment");

  // Ignore a caller-supplied status; a new collection must start at PENDING.
  return prisma.homeCollection.create({
    data: {
      appointmentId: data.appointmentId,
      address: data.address,
      specialInstructions: data.specialInstructions,
      status: "PENDING",
    },
    include: { appointment: appointmentWithLabAndTestReports },
  });
}

export async function getHomeCollections() {
  return prisma.homeCollection.findMany({
    include: {
      appointment: appointmentWithLabAndTestReports,
      collectorAssignment: { include: { collector: true } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
      samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHomeCollectionByAppointmentId(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({ where: { appointmentId } });
  if (!appointment) throw new Error("Appointment not found");

  const homeCollection = await prisma.homeCollection.findUnique({
    where: { appointmentId },
    include: {
      appointment: appointmentWithLabAndTestReports,
      collectorAssignment: { include: { collector: true } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
      samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
    },
  });
  if (!homeCollection) throw new Error("Home collection not found");
  return homeCollection;
}

export async function getHomeCollectionById(homeCollectionId: string) {
  const homeCollection = await prisma.homeCollection.findUnique({
    where: { homeCollectionId },
    include: {
      appointment: appointmentWithLabAndTestReports,
      collectorAssignment: { include: { collector: true } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
      samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
    },
  });
  if (!homeCollection) throw new Error("Home collection not found");
  return homeCollection;
}

export async function updateHomeCollection(homeCollectionId: string, data: UpdateHomeCollectionInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.homeCollection.findUnique({ where: { homeCollectionId } });
    if (!existing) throw new Error("Home collection not found");

    if (data.status && data.status !== existing.status) {
      // Do not let a generic update mark a collection completed without the report workflow.
      if (data.status === "COMPLETED") {
        throw new Error("Use the report/completion workflow to complete a home collection");
      }
      validateHomeCollectionTransition(existing.status as HomeCollectionStatus, data.status);
    }

    const updated = await tx.homeCollection.update({
      where: { homeCollectionId },
      data: {
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.specialInstructions !== undefined ? { specialInstructions: data.specialInstructions } : {}),
        ...(data.status ? { status: data.status, ...getHomeCollectionTimestamps(data.status) } : {}),
        ...(data.assignedAt !== undefined ? { assignedAt: data.assignedAt ? new Date(data.assignedAt) : null } : {}),
        ...(data.collectedAt !== undefined ? { collectedAt: data.collectedAt ? new Date(data.collectedAt) : null } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt ? new Date(data.completedAt) : null } : {}),
      },
    });

    if (data.status && data.status !== existing.status && data.status !== "PENDING" && data.status !== "CANCELLED") {
      await tx.homeCollectionTracking.create({
        data: { homeCollectionId, status: data.status, notes: "Status updated by home collection update API" },
      });
    }
    return updated;
  });
}

// =========================================================
// COLLECTOR
// =========================================================

export async function createCollector(data: CreateCollectorInput) {
  const lab = await prisma.lab.findUnique({ where: { labId: data.labId } });
  if (!lab) throw new Error("Lab not found");
  return prisma.collector.create({
    data: {
      labId: data.labId,
      name: data.name,
      phone: data.phone,
      role: data.role,
      qualification: data.qualification,
      qualificationNumber: data.qualificationNumber,
      qualificationProofUrl: data.qualificationProofUrl,
      qualificationStatus: data.qualificationStatus ?? "PENDING",
      status: data.status ?? "ACTIVE",
    },
    include: { assignments: true },
  });
}

export async function getCollectors() {
  return prisma.collector.findMany({ include: { assignments: true }, orderBy: { createdAt: "desc" } });
}

export async function getCollectorsByLab(labId: string) {
  const lab = await prisma.lab.findUnique({ where: { labId } });
  if (!lab) throw new Error("Lab not found");
  return prisma.collector.findMany({ where: { labId }, include: { assignments: true }, orderBy: { createdAt: "desc" } });
}

export async function getCollectorById(collectorId: string) {
  const collector = await prisma.collector.findUnique({
    where: { collectorId },
    include: { assignments: { include: { homeCollection: true } } },
  });
  if (!collector) throw new Error("Collector not found");
  return collector;
}

export async function getMyCollectorProfile(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: {
      collectorId: true, userId: true, name: true, phone: true, role: true,
      qualification: true, qualificationNumber: true, qualificationProofUrl: true,
      qualificationStatus: true, status: true, labId: true, createdAt: true, updatedAt: true,
    },
  });
  if (!collector) throw new Error("Collector profile not found for the logged-in user");
  return collector;
}

export async function getMyCollectorDashboard(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: { collectorId: true, name: true, status: true, qualificationStatus: true },
  });
  if (!collector) throw new Error("Collector not found for this user");
  if (collector.status !== "ACTIVE") throw new Error("Collector account is inactive");

  const collectorId = collector.collectorId;
  const [assigned, accepted, completed, rejected, cancelled, activeCollections, completedCollections] = await Promise.all([
    prisma.collectorAssignment.count({ where: { collectorId, status: "ASSIGNED" } }),
    prisma.collectorAssignment.count({ where: { collectorId, status: "ACCEPTED" } }),
    prisma.collectorAssignment.count({ where: { collectorId, status: "COMPLETED" } }),
    prisma.collectorAssignment.count({ where: { collectorId, status: "REJECTED" } }),
    prisma.collectorAssignment.count({ where: { collectorId, status: "CANCELLED" } }),
    prisma.collectorAssignment.count({
      where: { collectorId, status: { in: ["ASSIGNED", "ACCEPTED"] }, homeCollection: { status: { in: ["ASSIGNED", "EN_ROUTE", "SAMPLE_COLLECTED"] } } },
    }),
    prisma.collectorAssignment.count({ where: { collectorId, status: "COMPLETED" } }),
  ]);

  return {
    collector,
    bookings: { assigned, accepted, completed, rejected, cancelled, total: assigned + accepted + completed + rejected + cancelled },
    collections: { active: activeCollections, completed: completedCollections },
    earnings: { available: false, message: "Collector-specific earnings are not linked in the current schema." },
  };
}

export async function getMyCollectorHistory(userId: string) {
  const collector = await prisma.collector.findUnique({ where: { userId }, select: { collectorId: true, name: true, status: true } });
  if (!collector) throw new Error("Collector not found for this user");
  if (collector.status !== "ACTIVE") throw new Error("Collector account is inactive");

  const assignments = await prisma.collectorAssignment.findMany({
    where: { collectorId: collector.collectorId },
    include: {
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
          samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
          trackingEvents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
  return { collector, total: assignments.length, assignments };
}

export async function updateCollector(collectorId: string, data: UpdateCollectorInput) {
  const existing = await prisma.collector.findUnique({ where: { collectorId } });
  if (!existing) throw new Error("Collector not found");
  return prisma.collector.update({
    where: { collectorId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.qualification !== undefined ? { qualification: data.qualification } : {}),
      ...(data.qualificationNumber !== undefined ? { qualificationNumber: data.qualificationNumber } : {}),
      ...(data.qualificationProofUrl !== undefined ? { qualificationProofUrl: data.qualificationProofUrl } : {}),
      ...(data.qualificationStatus !== undefined ? { qualificationStatus: data.qualificationStatus } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
}

export async function deleteCollector(collectorId: string) {
  const existing = await prisma.collector.findUnique({ where: { collectorId }, include: { assignments: true } });
  if (!existing) throw new Error("Collector not found");
  if (existing.assignments.some((a) => a.status === "ASSIGNED" || a.status === "ACCEPTED")) {
    throw new Error("Cannot delete a collector with active assignments");
  }
  return prisma.collector.delete({ where: { collectorId } });
}

// =========================================================
// COLLECTOR ASSIGNMENT
// =========================================================

export async function createCollectorAssignment(data: CreateCollectorAssignmentInput) {
  return prisma.$transaction(async (tx) => {
    const homeCollection = await tx.homeCollection.findUnique({
      where: { homeCollectionId: data.homeCollectionId },
      include: { appointment: true },
    });
    if (!homeCollection) throw new Error("Home collection not found");
    if (!["PENDING", "ASSIGNED"].includes(homeCollection.status)) {
      throw new Error("Cannot assign or replace a collector after collection work has started");
    }

    const labId = homeCollection.appointment.labId;
    if (!labId) throw new Error("Home collection appointment does not have labId");
    const collector = await tx.collector.findUnique({ where: { collectorId: data.collectorId } });
    if (!collector) throw new Error("Collector not found");
    if (collector.labId !== labId) throw new Error("Collector does not belong to the appointment lab");
    if (collector.status !== "ACTIVE") throw new Error("Collector is not active");
    if (collector.qualificationStatus !== "VERIFIED") throw new Error("Collector qualification is not verified");

    const existing = await tx.collectorAssignment.findUnique({ where: { homeCollectionId: data.homeCollectionId } });
    let assignment;
    if (existing) {
      if (existing.status !== "REJECTED" && existing.status !== "CANCELLED") {
        throw new Error("A collector is already assigned to this home collection");
      }
      assignment = await tx.collectorAssignment.update({
        where: { collectorAssignmentId: existing.collectorAssignmentId },
        data: { collectorId: data.collectorId, status: "ASSIGNED", assignedAt: new Date() },
        include: { collector: true, homeCollection: true },
      });
    } else {
      assignment = await tx.collectorAssignment.create({
        data: { homeCollectionId: data.homeCollectionId, collectorId: data.collectorId, status: "ASSIGNED" },
        include: { collector: true, homeCollection: true },
      });
    }

    const currentStatus = homeCollection.status as HomeCollectionStatus;
    if (currentStatus === "PENDING") {
      await tx.homeCollection.update({ where: { homeCollectionId: data.homeCollectionId }, data: { status: "ASSIGNED", assignedAt: new Date() } });
      await tx.homeCollectionTracking.create({ data: { homeCollectionId: data.homeCollectionId, status: "ASSIGNED", notes: "Collector assigned" } });
    } else if (currentStatus !== "ASSIGNED") {
      throw new Error("Collection is not in an assignable state");
    }
    return assignment;
  }, { maxWait: 10000, timeout: 20000 });
}

export async function getCollectorAssignments() {
  return prisma.collectorAssignment.findMany({
    include: {
      collector: true,
      homeCollection: { include: { appointment: appointmentWithLabAndTestReports } },
    },
    orderBy: { assignedAt: "desc" },
  });
}

export async function getCollectorAssignmentById(collectorAssignmentId: string) {
  const assignment = await prisma.collectorAssignment.findUnique({
    where: { collectorAssignmentId },
    include: { collector: true, homeCollection: { include: { appointment: appointmentWithLabAndTestReports } } },
  });
  if (!assignment) throw new Error("Collector assignment not found");
  return assignment;
}

export async function updateCollectorAssignment(collectorAssignmentId: string, data: UpdateCollectorAssignmentInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.collectorAssignment.findUnique({
      where: { collectorAssignmentId },
      include: { homeCollection: true },
    });
    if (!existing) throw new Error("Collector assignment not found");
    if (!data.status) throw new Error("Assignment status is required");

    const current = existing.status as AssignmentStatus;
    const next = data.status;
    const allowed: Record<AssignmentStatus, AssignmentStatus[]> = {
      ASSIGNED: ["ACCEPTED", "REJECTED", "CANCELLED"],
      ACCEPTED: ["COMPLETED", "CANCELLED"],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (current === next) return existing;
    if (!allowed[current]?.includes(next)) {
      throw new Error(`Invalid collector assignment transition: ${current} -> ${next}`);
    }

    const collectionStatus = existing.homeCollection.status as HomeCollectionStatus;
    if ((next === "REJECTED" || next === "CANCELLED") && !["PENDING", "ASSIGNED"].includes(collectionStatus)) {
      throw new Error("Cannot reject or cancel an assignment after collection work has started");
    }
    if (next === "COMPLETED" && !["IN_LAB", "PROCESSING", "REPORT_READY", "COMPLETED"].includes(collectionStatus)) {
      throw new Error("A collector assignment can be completed only after the samples reach the lab");
    }

    const assignment = await tx.collectorAssignment.update({
      where: { collectorAssignmentId },
      data: { status: next },
      include: { collector: true, homeCollection: true },
    });

    if (next === "REJECTED" || next === "CANCELLED") {
      // Reset only an untouched assignment. Do not move the collection backward
      // after sample collection has begun.
      if (collectionStatus === "ASSIGNED") {
        await tx.homeCollection.update({
          where: { homeCollectionId: existing.homeCollectionId },
          data: { status: "PENDING", assignedAt: null },
        });
      }
    }
    // Completing the collector's assignment does NOT complete the appointment
    // or home collection. Report workflow owns those completion decisions.
    return assignment;
  }, { maxWait: 10000, timeout: 20000 });
}

export async function deleteCollectorAssignment(collectorAssignmentId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.collectorAssignment.findUnique({
      where: { collectorAssignmentId },
      include: { homeCollection: true },
    });
    if (!existing) throw new Error("Collector assignment not found");
    if (existing.status === "ACCEPTED" || existing.status === "COMPLETED") {
      throw new Error("Cannot delete an accepted or completed assignment");
    }
    if (!["PENDING", "ASSIGNED"].includes(existing.homeCollection.status)) {
      throw new Error("Cannot delete an assignment after collection work has started");
    }

    const deleted = await tx.collectorAssignment.delete({ where: { collectorAssignmentId } });
    if (existing.homeCollection.status === "ASSIGNED") {
      await tx.homeCollection.update({ where: { homeCollectionId: existing.homeCollectionId }, data: { status: "PENDING", assignedAt: null } });
    }
    return deleted;
  });
}

// =========================================================
// HOME COLLECTION TRACKING
// =========================================================

export async function createHomeCollectionTracking(data: CreateHomeCollectionTrackingInput) {
  return prisma.$transaction(async (tx) => {
    const homeCollection = await tx.homeCollection.findUnique({ where: { homeCollectionId: data.homeCollectionId } });
    if (!homeCollection) throw new Error("Home collection not found");
    const current = homeCollection.status as HomeCollectionStatus;
    validateHomeCollectionTransition(current, data.status);

    if (current === data.status) {
      throw new Error(`Home collection is already in status ${data.status}`);
    }

    const tracking = await tx.homeCollectionTracking.create({
      data: { homeCollectionId: data.homeCollectionId, status: data.status, notes: data.notes },
    });
    await tx.homeCollection.update({
      where: { homeCollectionId: data.homeCollectionId },
      data: { status: data.status, ...getHomeCollectionTimestamps(data.status) },
    });
    return tracking;
  }, { maxWait: 10000, timeout: 20000 });
}

export async function getHomeCollectionTracking(homeCollectionId: string) {
  const homeCollection = await prisma.homeCollection.findUnique({ where: { homeCollectionId } });
  if (!homeCollection) throw new Error("Home collection not found");
  return prisma.homeCollectionTracking.findMany({ where: { homeCollectionId }, orderBy: { createdAt: "asc" } });
}

export async function getHomeCollectionTrackingById(trackingId: string) {
  const tracking = await prisma.homeCollectionTracking.findUnique({ where: { trackingId }, include: { homeCollection: true } });
  if (!tracking) throw new Error("Tracking record not found");
  return tracking;
}

// =========================================================
// COLLECTOR BOOKINGS AND HISTORY
// =========================================================

export async function getCollectorBookings(collectorId: string) {
  const collector = await prisma.collector.findUnique({ where: { collectorId } });
  if (!collector) throw new Error("Collector not found");
  return prisma.collectorAssignment.findMany({
    where: { collectorId, status: { in: ["ASSIGNED", "ACCEPTED"] } },
    include: {
      collector: true,
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
          samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
          trackingEvents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
}

export async function getCollectorHistory(collectorId: string) {
  const collector = await prisma.collector.findUnique({ where: { collectorId } });
  if (!collector) throw new Error("Collector not found");
  return prisma.collectorAssignment.findMany({
    where: { collectorId, status: { in: ["COMPLETED", "CANCELLED", "REJECTED"] } },
    include: {
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
          samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
          trackingEvents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
}

export async function acceptCollectorAssignment(collectorAssignmentId: string, collectorId: string) {
  const collector = await prisma.collector.findUnique({ where: { collectorId } });
  if (!collector) throw new Error("Collector not found");
  if (collector.status !== "ACTIVE") throw new Error("Collector is not active");
  if (collector.qualificationStatus !== "VERIFIED") throw new Error("Collector qualification is not verified");

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.collectorAssignment.findUnique({ where: { collectorAssignmentId } });
    if (!assignment) throw new Error("Collector assignment not found");
    if (assignment.collectorId !== collectorId) throw new Error("This assignment does not belong to this collector");
    if (assignment.status !== "ASSIGNED") throw new Error("Only assigned bookings can be accepted");
    return tx.collectorAssignment.update({
      where: { collectorAssignmentId },
      data: { status: "ACCEPTED" },
      include: { collector: true, homeCollection: { include: { appointment: appointmentWithLabAndTestReports } } },
    });
  });
}

// =========================================================
// AUTHENTICATED COLLECTOR APIS
// =========================================================

export async function getMyCollectorBookings(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: { collectorId: true, userId: true, name: true, labId: true, status: true, qualificationStatus: true },
  });
  if (!collector) throw new Error("Collector not found for this user");
  if (collector.status !== "ACTIVE") throw new Error("Collector account is inactive");

  const assignments = await prisma.collectorAssignment.findMany({
    where: { collectorId: collector.collectorId, status: { in: ["ASSIGNED", "ACCEPTED"] } },
    include: {
      collector: true,
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
          samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
          trackingEvents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
  return { collector, total: assignments.length, assignments };
}

export async function acceptMyCollectorAssignment(collectorAssignmentId: string, userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: { collectorId: true, status: true, qualificationStatus: true },
  });
  if (!collector) throw new Error("Collector not found");
  if (collector.status !== "ACTIVE") throw new Error("Collector is not active");
  if (collector.qualificationStatus !== "VERIFIED") throw new Error("Collector qualification is not verified");

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.collectorAssignment.findUnique({ where: { collectorAssignmentId } });
    if (!assignment) throw new Error("Assignment not found");
    if (assignment.collectorId !== collector.collectorId) throw new Error("Assignment does not belong to this collector");
    if (assignment.status !== "ASSIGNED") throw new Error("Only assigned bookings can be accepted");
    return tx.collectorAssignment.update({
      where: { collectorAssignmentId },
      data: { status: "ACCEPTED" },
      include: { homeCollection: true, collector: true },
    });
  });
}

export async function rejectMyCollectorAssignment(collectorAssignmentId: string, userId: string) {
  const collector = await prisma.collector.findUnique({ where: { userId }, select: { collectorId: true, status: true } });
  if (!collector) throw new Error("Collector not found");
  if (collector.status !== "ACTIVE") throw new Error("Collector is not active");

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.collectorAssignment.findUnique({
      where: { collectorAssignmentId },
      include: { homeCollection: true },
    });
    if (!assignment) throw new Error("Assignment not found");
    if (assignment.collectorId !== collector.collectorId) throw new Error("Assignment does not belong to this collector");
    if (assignment.status !== "ASSIGNED" && assignment.status !== "ACCEPTED") {
      throw new Error("This assignment cannot be rejected");
    }
    if (!["PENDING", "ASSIGNED"].includes(assignment.homeCollection.status)) {
      throw new Error("This assignment cannot be rejected after collection work has started");
    }

    const rejected = await tx.collectorAssignment.update({
      where: { collectorAssignmentId },
      data: { status: "REJECTED" },
      include: { homeCollection: true, collector: true },
    });
    if (assignment.homeCollection.status === "ASSIGNED") {
      await tx.homeCollection.update({
        where: { homeCollectionId: assignment.homeCollectionId },
        data: { status: "PENDING", assignedAt: null },
      });
    }
    return rejected;
  });
}

export async function getHomeCollectionSummary(labUserId: string) {
  const lab = await prisma.lab.findFirst({ where: { labUserId }, select: { labId: true } });
  if (!lab) throw new Error("Lab not found");

  const statuses = ["PENDING", "ASSIGNED", "EN_ROUTE", "SAMPLE_COLLECTED", "IN_LAB", "PROCESSING", "REPORT_READY", "COMPLETED", "CANCELLED"] as const;
  const [total, grouped] = await Promise.all([
    prisma.homeCollection.count({ where: { appointment: { labId: lab.labId } } }),
    prisma.homeCollection.groupBy({ by: ["status"], where: { appointment: { labId: lab.labId } }, _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<(typeof statuses)[number], number>;
  for (const item of grouped) counts[item.status] = item._count._all;
  return { total, counts };
}

export async function getHomeCollectionHistory(homeCollectionId: string, labUserId: string) {
  const lab = await prisma.lab.findFirst({ where: { labUserId }, select: { labId: true } });
  if (!lab) throw new Error("Lab not found");

  const collection = await prisma.homeCollection.findFirst({
    where: { homeCollectionId, appointment: { is: { labId: lab.labId } } },
    include: {
      appointment: appointmentWithLabAndTestReports,
      collectorAssignment: { include: { collector: true } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
      samples: { include: { trackingEvents: { orderBy: { createdAt: "asc" } }, evidence: true } },
    },
  });
  if (!collection) throw new Error("Home collection not found");
  return collection;
}
