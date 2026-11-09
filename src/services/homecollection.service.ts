
import { prisma } from "./prisma.service";

// =========================================================
// CONSTANTS
// =========================================================

const LAB_OFFER_WINDOW_MINUTES = 5;
const INDEPENDENT_COLLECTOR_RADIUS_KM = 25;
const COLLECTOR_LOCATION_MAX_AGE_MINUTES = 10;
const MAX_ACTIVE_BOOKINGS_PER_COLLECTOR = 5;

const ACTIVE_ASSIGNMENT_STATUSES = ["ASSIGNED", "ACCEPTED"] as const;

const ACTIVE_COLLECTION_STATUSES = [
  "ASSIGNED",
  "EN_ROUTE",
  "SAMPLE_COLLECTED",
  "IN_LAB",
] as const;

// =========================================================
// INPUT TYPES
// =========================================================

export interface CreateHomeCollectionInput {
  appointmentId: string;
  address: string;
  latitude: number;
  longitude: number;
  specialInstructions?: string;
  status?: HomeCollectionStatus;
}

export interface UpdateHomeCollectionInput {
  address?: string;
  latitude?: number;
  longitude?: number;
  specialInstructions?: string;
  status?: HomeCollectionStatus;
  assignedAt?: string;
  collectedAt?: string;
  completedAt?: string;
}

export interface CreateCollectorInput {
  userId: string;
  labId?: string;
  collectorType?: "LAB" | "INDEPENDENT";
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
  latitude?: number;
  longitude?: number;
  isAvailable?: boolean;
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
// STATUS TYPES
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

type AssignmentStatus =
  | "ASSIGNED"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

type CollectorType = "LAB" | "INDEPENDENT";

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

function validateHomeCollectionTransition(
  current: HomeCollectionStatus,
  next: HomeCollectionStatus,
) {
  if (current === next) return;

  if (!allowedTransitions[current]?.includes(next)) {
    throw new Error(
      `Invalid home collection status transition: ${current} -> ${next}`,
    );
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
    throw new Error(
      `Cannot create home collection for an appointment with status ${status}`,
    );
  }
}

function validateCoordinates(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Valid latitude and longitude are required");
  }
}

// =========================================================
// DISTANCE
// =========================================================

function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const earthRadiusKm = 6371;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(latitude2 - latitude1);
  const longitudeDifference = toRadians(longitude2 - longitude1);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const angularDistance =
    2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));

  return earthRadiusKm * angularDistance;
}

// =========================================================
// SHARED INCLUDES
// =========================================================

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
    reports: {
      include: {
        files: true,
        appointmentTest: true,
      },
    },
  },
} as const;

const homeCollectionDetailsInclude = {
  appointment: appointmentWithLabAndTestReports,
  collectorAssignment: {
    include: {
      collector: true,
    },
  },
  bookingOffers: {
    include: {
      collector: true,
    },
    orderBy: {
      offeredAt: "desc" as const,
    },
  },
  trackingEvents: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  samples: {
    include: {
      trackingEvents: {
        orderBy: {
          createdAt: "asc" as const,
        },
      },
      evidence: true,
    },
  },
} as const;

const collectorBookingInclude = {
  collector: true,
  homeCollection: {
    include: {
      appointment: appointmentWithLabAndTestReports,
      samples: {
        include: {
          trackingEvents: {
            orderBy: {
              createdAt: "asc" as const,
            },
          },
          evidence: true,
        },
      },
      trackingEvents: {
        orderBy: {
          createdAt: "asc" as const,
        },
      },
    },
  },
} as const;

// =========================================================
// DATABASE LOCK HELPERS
// =========================================================


async function lockHomeCollection(
  tx: any,
  homeCollectionId: string,
) {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${homeCollectionId})::bigint
    )::text AS lock_result
  `;
}

async function lockCollector(
  tx: any,
  collectorId: string,
) {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${`collector:${collectorId}`})::bigint
    )::text AS lock_result
  `;
}

// =========================================================
// COLLECTOR ELIGIBILITY
// =========================================================

function getFreshLocationThreshold() {
  return new Date(
    Date.now() - COLLECTOR_LOCATION_MAX_AGE_MINUTES * 60 * 1000,
  );
}

async function getEligibleLabCollectors(
  labId: string,
) {
  return prisma.collector.findMany({
    where: {
      collectorType: "LAB",
      labId,
      status: "ACTIVE",
      qualificationStatus: "VERIFIED",
      isAvailable: true,
      latitude: { not: null },
      longitude: { not: null },
      lastLocationAt: {
        gte: getFreshLocationThreshold(),
      },
    },
  });
}

async function getEligibleIndependentCollectors() {
  return prisma.collector.findMany({
    where: {
      collectorType: "INDEPENDENT",
      labId: null,
      status: "ACTIVE",
      qualificationStatus: "VERIFIED",
      isAvailable: true,
      latitude: { not: null },
      longitude: { not: null },
      lastLocationAt: {
        gte: getFreshLocationThreshold(),
      },
    },
  });
}

async function createLabCollectorOffers(
  tx: any,
  homeCollection: any,
  labId: string,
) {
  const collectors = await tx.collector.findMany({
    where: {
      collectorType: "LAB",
      labId,
      status: "ACTIVE",
      qualificationStatus: "VERIFIED",
      isAvailable: true,
      latitude: { not: null },
      longitude: { not: null },
      lastLocationAt: {
        gte: getFreshLocationThreshold(),
      },
    },
  });

  if (
    homeCollection.latitude === null ||
    homeCollection.longitude === null
  ) {
    throw new Error("Home collection location is missing");
  }

  const expiresAt = new Date(
    homeCollection.matchingStartedAt.getTime() +
      LAB_OFFER_WINDOW_MINUTES * 60 * 1000,
  );

  const offers = collectors.map((collector: any) => ({
    homeCollectionId: homeCollection.homeCollectionId,
    collectorId: collector.collectorId,
    distanceKm: calculateDistanceKm(
      homeCollection.latitude,
      homeCollection.longitude,
      collector.latitude,
      collector.longitude,
    ),
    expiresAt,
  }));

  if (offers.length > 0) {
    await tx.collectorBookingOffer.createMany({
      data: offers,
      skipDuplicates: true,
    });
  }

  return offers.length;
}

async function createIndependentCollectorOffers(
  tx: any,
  homeCollection: any,
) {
  if (
    homeCollection.latitude == null ||
    homeCollection.longitude == null
  ) {
    throw new Error("Home collection location is missing");
  }

  // Find collectors who have already received an offer
  // for this home collection.
  const existingOffers = await tx.collectorBookingOffer.findMany({
    where: {
      homeCollectionId: homeCollection.homeCollectionId,
    },
    select: {
      collectorId: true,
    },
  });

  const existingCollectorIds = new Set(
    existingOffers.map((offer: any) => offer.collectorId),
  );

  // Find currently eligible independent collectors.
  const collectors = await tx.collector.findMany({
    where: {
      collectorType: "INDEPENDENT",
      labId: null,
      status: "ACTIVE",
      qualificationStatus: "VERIFIED",
      isAvailable: true,
      latitude: {
        not: null,
      },
      longitude: {
        not: null,
      },
      lastLocationAt: {
        gte: getFreshLocationThreshold(),
      },
    },
  });

  const eligibleOffers = collectors
    .map((collector: any) => {
      const distanceKm = calculateDistanceKm(
        homeCollection.latitude,
        homeCollection.longitude,
        collector.latitude,
        collector.longitude,
      );

      return {
        collectorId: collector.collectorId,
        homeCollectionId: homeCollection.homeCollectionId,
        distanceKm,
      };
    })
    .filter(
      (offer: any) =>
        offer.distanceKm <= INDEPENDENT_COLLECTOR_RADIUS_KM &&
        !existingCollectorIds.has(offer.collectorId),
    );

  if (eligibleOffers.length === 0) {
    return 0;
  }

  const result = await tx.collectorBookingOffer.createMany({
    data: eligibleOffers,
    skipDuplicates: true,
  });

  return result.count;
}
// =========================================================
// HOME COLLECTION CREATION
// =========================================================

export async function createHomeCollection(
  data: CreateHomeCollectionInput,
) {
  validateCoordinates(data.latitude, data.longitude);

  const appointment = await prisma.appointment.findUnique({
    where: {
      appointmentId: data.appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.appointmentType !== "LAB") {
    throw new Error(
      "Home collection is only available for LAB appointments",
    );
  }

  if (appointment.appointmentMode !== "HOME") {
    throw new Error(
      "Home collection can only be created for HOME appointments",
    );
  }

  assertAppointmentCanHaveHomeCollection(appointment.status);

  if (!appointment.labId) {
    throw new Error("Appointment does not have a selected lab");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.homeCollection.findUnique({
      where: {
        appointmentId: data.appointmentId,
      },
    });

    if (existing) {
      throw new Error(
        "Home collection already exists for this appointment",
      );
    }

    const now = new Date();

    const homeCollection = await tx.homeCollection.create({
      data: {
        appointmentId: data.appointmentId,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        specialInstructions: data.specialInstructions,
        status: "PENDING",
        allocationStage: "LAB_COLLECTORS",
        matchingStartedAt: now,
      },
    });

    const offersCreated = await createLabCollectorOffers(
      tx,
      homeCollection,
      appointment.labId!,
    );

    return {
      ...homeCollection,
      labCollectorOffersCreated: offersCreated,
      allocationStage: "LAB_COLLECTORS",
      escalationAt: new Date(
        now.getTime() + LAB_OFFER_WINDOW_MINUTES * 60 * 1000,
      ),
    };
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

// =========================================================
// HOME COLLECTION RETRIEVAL
// =========================================================

export async function getHomeCollections() {
  return prisma.homeCollection.findMany({
    include: homeCollectionDetailsInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getHomeCollectionByAppointmentId(
  appointmentId: string,
) {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const homeCollection = await prisma.homeCollection.findUnique({
    where: { appointmentId },
    include: homeCollectionDetailsInclude,
  });

  if (!homeCollection) {
    throw new Error("Home collection not found");
  }

  return homeCollection;
}

export async function getHomeCollectionById(
  homeCollectionId: string,
) {
  const homeCollection = await prisma.homeCollection.findUnique({
    where: { homeCollectionId },
    include: homeCollectionDetailsInclude,
  });

  if (!homeCollection) {
    throw new Error("Home collection not found");
  }

  return homeCollection;
}

// =========================================================
// HOME COLLECTION UPDATE
// =========================================================

export async function updateHomeCollection(
  homeCollectionId: string,
  data: UpdateHomeCollectionInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.homeCollection.findUnique({
      where: { homeCollectionId },
    });

    if (!existing) {
      throw new Error("Home collection not found");
    }

    if (data.latitude !== undefined || data.longitude !== undefined) {
  const latitude = data.latitude ?? existing.latitude;
  const longitude = data.longitude ?? existing.longitude;

  if (latitude === null || longitude === null) {
    throw new Error(
      "Both latitude and longitude are required when updating location",
    );
  }

  validateCoordinates(latitude, longitude);
}

    if (data.status && data.status !== existing.status) {
      if (data.status === "COMPLETED") {
        throw new Error(
          "Use the report/completion workflow to complete a home collection",
        );
      }

      if (data.status === "ASSIGNED") {
        throw new Error(
          "A collection can only become ASSIGNED through collector offer acceptance",
        );
      }

      validateHomeCollectionTransition(
        existing.status as HomeCollectionStatus,
        data.status,
      );
    }

    const updated = await tx.homeCollection.update({
      where: { homeCollectionId },
      data: {
        ...(data.address !== undefined
          ? { address: data.address }
          : {}),
        ...(data.latitude !== undefined
          ? { latitude: data.latitude }
          : {}),
        ...(data.longitude !== undefined
          ? { longitude: data.longitude }
          : {}),
        ...(data.specialInstructions !== undefined
          ? { specialInstructions: data.specialInstructions }
          : {}),
        ...(data.status
          ? {
              status: data.status,
              ...getHomeCollectionTimestamps(data.status),
            }
          : {}),
        ...(data.assignedAt !== undefined
          ? {
              assignedAt: data.assignedAt
                ? new Date(data.assignedAt)
                : null,
            }
          : {}),
        ...(data.collectedAt !== undefined
          ? {
              collectedAt: data.collectedAt
                ? new Date(data.collectedAt)
                : null,
            }
          : {}),
        ...(data.completedAt !== undefined
          ? {
              completedAt: data.completedAt
                ? new Date(data.completedAt)
                : null,
            }
          : {}),
      },
    });

    if (
      data.status &&
      data.status !== existing.status &&
      data.status !== "PENDING" &&
      data.status !== "CANCELLED"
    ) {
      await tx.homeCollectionTracking.create({
        data: {
          homeCollectionId,
          status: data.status,
          notes: "Status updated by home collection update API",
        },
      });
    }

    return updated;
  });
}

// =========================================================
// COLLECTOR CREATION
// =========================================================

export async function createCollector(data: CreateCollectorInput) {
  if (!data.userId?.trim()) {
    throw new Error("userId is required");
  }

  const collectorType: CollectorType = data.collectorType ?? "LAB";

  if (collectorType === "LAB") {
    if (!data.labId) {
      throw new Error("labId is required for a lab-affiliated collector");
    }

    const lab = await prisma.lab.findUnique({
      where: { labId: data.labId },
    });

    if (!lab) {
      throw new Error("Lab not found");
    }
  }

  if (collectorType === "INDEPENDENT" && data.labId) {
    throw new Error(
      "Independent collectors must not be assigned to a lab",
    );
  }

  const existingCollector = await prisma.collector.findUnique({
    where: { userId: data.userId },
  });

  if (existingCollector) {
    throw new Error(
      "A collector profile already exists for this user",
    );
  }

  return prisma.collector.create({
    data: {
      userId: data.userId,
      collectorType,
      labId: collectorType === "LAB" ? data.labId : null,
      name: data.name,
      phone: data.phone,
      role: data.role ?? "TECHNICIAN",
      qualification: data.qualification,
      qualificationNumber: data.qualificationNumber,
      qualificationProofUrl: data.qualificationProofUrl,
      qualificationStatus: data.qualificationStatus ?? "PENDING",
      status: data.status ?? "ACTIVE",
    },
    include: {
      assignments: true,
      bookingOffers: true,
    },
  });
}

// =========================================================
// COLLECTOR RETRIEVAL
// =========================================================

export async function getCollectors() {
  return prisma.collector.findMany({
    include: {
      assignments: true,
      bookingOffers: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCollectorsByLab(labId: string) {
  const lab = await prisma.lab.findUnique({
    where: { labId },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  return prisma.collector.findMany({
    where: { labId },
    include: {
      assignments: true,
      bookingOffers: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCollectorById(collectorId: string) {
  const collector = await prisma.collector.findUnique({
    where: { collectorId },
    include: {
      assignments: {
        include: {
          homeCollection: true,
        },
      },
      bookingOffers: {
        include: {
          homeCollection: true,
        },
      },
    },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  return collector;
}

export async function getMyCollectorProfile(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: {
      collectorId: true,
      userId: true,
      name: true,
      phone: true,
      role: true,
      collectorType: true,
      qualification: true,
      qualificationNumber: true,
      qualificationProofUrl: true,
      qualificationStatus: true,
      status: true,
      labId: true,
      latitude: true,
      longitude: true,
      lastLocationAt: true,
      isAvailable: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!collector) {
    throw new Error(
      "Collector profile not found for the logged-in user",
    );
  }

  return collector;
}

// =========================================================
// COLLECTOR LOCATION AND AVAILABILITY
// =========================================================

export async function updateMyCollectorLocation(
  userId: string,
  latitude: number,
  longitude: number,
  isAvailable?: boolean,
) {
  validateCoordinates(latitude, longitude);

  const collector = await prisma.collector.findUnique({
    where: { userId },
  });

  if (!collector) {
    throw new Error("Collector not found for this user");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector account is inactive");
  }

  return prisma.collector.update({
    where: { collectorId: collector.collectorId },
    data: {
      latitude,
      longitude,
      lastLocationAt: new Date(),
      ...(isAvailable !== undefined ? { isAvailable } : {}),
    },
  });
}

// =========================================================
// COLLECTOR DASHBOARD
// =========================================================

export async function getMyCollectorDashboard(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: {
      collectorId: true,
      name: true,
      status: true,
      qualificationStatus: true,
      collectorType: true,
      labId: true,
      isAvailable: true,
    },
  });

  if (!collector) {
    throw new Error("Collector not found for this user");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector account is inactive");
  }

  const collectorId = collector.collectorId;

  const [
    assigned,
    accepted,
    completed,
    rejected,
    cancelled,
    pendingOffers,
    activeCollections,
    completedCollections,
  ] = await Promise.all([
    prisma.collectorAssignment.count({
      where: { collectorId, status: "ASSIGNED" },
    }),
    prisma.collectorAssignment.count({
      where: { collectorId, status: "ACCEPTED" },
    }),
    prisma.collectorAssignment.count({
      where: { collectorId, status: "COMPLETED" },
    }),
    prisma.collectorAssignment.count({
      where: { collectorId, status: "REJECTED" },
    }),
    prisma.collectorAssignment.count({
      where: { collectorId, status: "CANCELLED" },
    }),
    prisma.collectorBookingOffer.count({
      where: {
        collectorId,
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    }),
    prisma.collectorAssignment.count({
      where: {
        collectorId,
        status: { in: [...ACTIVE_ASSIGNMENT_STATUSES] },
        homeCollection: {
          status: { in: [...ACTIVE_COLLECTION_STATUSES] },
        },
      },
    }),
    prisma.collectorAssignment.count({
      where: { collectorId, status: "COMPLETED" },
    }),
  ]);

  return {
    collector,
    bookings: {
      assigned,
      accepted,
      completed,
      rejected,
      cancelled,
      pendingOffers,
      total: assigned + accepted + completed + rejected + cancelled,
    },
    collections: {
      active: activeCollections,
      completed: completedCollections,
    },
    earnings: {
      available: false,
      message:
        "Collector-specific earnings are not linked in the current schema.",
    },
  };
}

// =========================================================
// COLLECTOR HISTORY
// =========================================================

export async function getMyCollectorHistory(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: {
      collectorId: true,
      name: true,
      status: true,
    },
  });

  if (!collector) {
    throw new Error("Collector not found for this user");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector account is inactive");
  }

  const assignments = await prisma.collectorAssignment.findMany({
    where: {
      collectorId: collector.collectorId,
    },
    include: collectorBookingInclude,
    orderBy: {
      assignedAt: "desc",
    },
  });

  const offers = await prisma.collectorBookingOffer.findMany({
    where: {
      collectorId: collector.collectorId,
      status: {
        in: ["REJECTED", "EXPIRED"],
      },
    },
    include: {
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
        },
      },
    },
    orderBy: {
      offeredAt: "desc",
    },
  });

  return {
    collector,
    total: assignments.length + offers.length,
    assignments,
    offers,
  };
}

// =========================================================
// COLLECTOR UPDATE AND DELETE
// =========================================================

export async function updateCollector(
  collectorId: string,
  data: UpdateCollectorInput,
) {
  const existing = await prisma.collector.findUnique({
    where: { collectorId },
  });

  if (!existing) {
    throw new Error("Collector not found");
  }

  if (data.latitude !== undefined || data.longitude !== undefined) {
  const latitude = data.latitude ?? existing.latitude;
  const longitude = data.longitude ?? existing.longitude;

  if (latitude === null || longitude === null) {
    throw new Error(
      "Both latitude and longitude are required when updating location",
    );
  }

  validateCoordinates(latitude, longitude);
}

  return prisma.collector.update({
    where: { collectorId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.qualification !== undefined
        ? { qualification: data.qualification }
        : {}),
      ...(data.qualificationNumber !== undefined
        ? { qualificationNumber: data.qualificationNumber }
        : {}),
      ...(data.qualificationProofUrl !== undefined
        ? { qualificationProofUrl: data.qualificationProofUrl }
        : {}),
      ...(data.qualificationStatus !== undefined
        ? { qualificationStatus: data.qualificationStatus }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.latitude !== undefined
        ? {
            latitude: data.latitude,
            lastLocationAt: new Date(),
          }
        : {}),
      ...(data.longitude !== undefined
        ? {
            longitude: data.longitude,
            lastLocationAt: new Date(),
          }
        : {}),
      ...(data.isAvailable !== undefined
        ? { isAvailable: data.isAvailable }
        : {}),
    },
  });
}

export async function deleteCollector(collectorId: string) {
  const existing = await prisma.collector.findUnique({
    where: { collectorId },
    include: {
      assignments: true,
      bookingOffers: true,
    },
  });

  if (!existing) {
    throw new Error("Collector not found");
  }

  if (
    existing.assignments.some(
      (assignment) =>
        assignment.status === "ASSIGNED" ||
        assignment.status === "ACCEPTED",
    )
  ) {
    throw new Error(
      "Cannot delete a collector with active assignments",
    );
  }

  if (
    existing.bookingOffers.some(
      (offer) => offer.status === "PENDING",
    )
  ) {
    throw new Error(
      "Cannot delete a collector with pending booking offers",
    );
  }

  return prisma.collector.delete({
    where: { collectorId },
  });
}

// =========================================================
// FIVE-MINUTE ESCALATION WORKER FUNCTION
// =========================================================

/**
 * Call this function from a backend cron/worker every 30-60 seconds.
 *
 * It escalates collections whose five-minute lab-collector window
 * has elapsed and which still have no accepted assignment.
 *
 * This function does not schedule itself.
 */

export async function escalateDueHomeCollections() {
  const cutoff = new Date(
    Date.now() - LAB_OFFER_WINDOW_MINUTES * 60 * 1000,
  );

  // 1. Find LAB bookings whose offer window has expired.
  const dueCollections = await prisma.homeCollection.findMany({
    where: {
      status: "PENDING",
      allocationStage: "LAB_COLLECTORS",
      matchingStartedAt: {
        lte: cutoff,
      },
      collectorAssignment: {
        is: null,
      },
    },
    select: {
      homeCollectionId: true,
    },
    orderBy: {
      matchingStartedAt: "asc",
    },
  });

  // 2. Capture bookings already in the independent pool.
  // This query runs before escalation so newly escalated bookings
  // aren't processed twice in the same scheduler run.
  const independentPoolCollections =
    await prisma.homeCollection.findMany({
      where: {
        status: "PENDING",
        allocationStage: "INDEPENDENT_POOL",
        collectorAssignment: {
          is: null,
        },
      },
      select: {
        homeCollectionId: true,
      },
      orderBy: {
        independentEscalatedAt: "asc",
      },
    });

  let escalated = 0;
  let newlyCreatedOffers = 0;
  let retriedIndependentOffers = 0;

  const missingLocationIds: string[] = [];

  // 3. Process LAB offer expiry and escalation.
  for (const item of dueCollections) {
    const result = await prisma.$transaction(
      async (tx) => {
        await lockHomeCollection(tx, item.homeCollectionId);

        const collection = await tx.homeCollection.findUnique({
          where: {
            homeCollectionId: item.homeCollectionId,
          },
          include: {
            appointment: true,
            collectorAssignment: true,
          },
        });

        if (!collection) {
          return {
            escalated: false,
            offersCreated: 0,
            missingLocation: false,
          };
        }

        if (
          collection.status !== "PENDING" ||
          collection.allocationStage !== "LAB_COLLECTORS" ||
          collection.collectorAssignment
        ) {
          return {
            escalated: false,
            offersCreated: 0,
            missingLocation: false,
          };
        }

        if (
          collection.matchingStartedAt.getTime() >
          cutoff.getTime()
        ) {
          return {
            escalated: false,
            offersCreated: 0,
            missingLocation: false,
          };
        }

        if (
          collection.latitude == null ||
          collection.longitude == null
        ) {
          return {
            escalated: false,
            offersCreated: 0,
            missingLocation: true,
          };
        }

        await tx.collectorBookingOffer.updateMany({
          where: {
            homeCollectionId: collection.homeCollectionId,
            status: "PENDING",
            expiresAt: {
              lte: new Date(),
            },
          },
          data: {
            status: "EXPIRED",
            respondedAt: new Date(),
          },
        });

        await tx.homeCollection.update({
          where: {
            homeCollectionId: collection.homeCollectionId,
          },
          data: {
            allocationStage: "INDEPENDENT_POOL",
            independentEscalatedAt: new Date(),
          },
        });

        const count = await createIndependentCollectorOffers(
          tx,
          collection,
        );

        return {
          escalated: true,
          offersCreated: count,
          missingLocation: false,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    if (result.missingLocation) {
      missingLocationIds.push(item.homeCollectionId);
      continue;
    }

    if (result.escalated) {
      escalated += 1;
      newlyCreatedOffers += result.offersCreated;
    }
  }

  // 4. Retry bookings already in INDEPENDENT_POOL.
  // This catches collectors who update their GPS or availability
  // after the original escalation.
  for (const item of independentPoolCollections) {
    const count = await prisma.$transaction(
      async (tx) => {
        await lockHomeCollection(tx, item.homeCollectionId);

        const collection = await tx.homeCollection.findUnique({
          where: {
            homeCollectionId: item.homeCollectionId,
          },
          include: {
            collectorAssignment: true,
          },
        });

        if (
          !collection ||
          collection.status !== "PENDING" ||
          collection.allocationStage !== "INDEPENDENT_POOL" ||
          collection.collectorAssignment
        ) {
          return 0;
        }

        if (
          collection.latitude == null ||
          collection.longitude == null
        ) {
          return 0;
        }

        return createIndependentCollectorOffers(tx, collection);
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    retriedIndependentOffers += count;
  }

  return {
    checked: dueCollections.length,
    escalated,
    independentOffersCreated:
      newlyCreatedOffers + retriedIndependentOffers,
    newlyCreatedOffers,
    retriedIndependentOffers,
    independentPoolChecked: independentPoolCollections.length,
    skippedMissingLocation: missingLocationIds.length,
    missingLocationIds,
  };
}


// =========================================================
// COLLECTOR BOOKING OFFERS
// =========================================================

export async function getMyCollectorBookingOffers(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: {
      collectorId: true,
      name: true,
      status: true,
      qualificationStatus: true,
      collectorType: true,
      labId: true,
    },
  });

  if (!collector) {
    throw new Error("Collector not found for this user");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector account is inactive");
  }

  const offers = await prisma.collectorBookingOffer.findMany({
    where: {
      collectorId: collector.collectorId,
      status: "PENDING",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
      homeCollection: {
        is: {
          status: "PENDING",
          allocationStage: {
            in: ["LAB_COLLECTORS", "INDEPENDENT_POOL"],
          },
          collectorAssignment: {
            is: null,
          },
        },
      },
    },
    include: {
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
          samples: true,
        },
      },
    },
    orderBy: {
      offeredAt: "desc",
    },
  });

  return {
    collector,
    total: offers.length,
    offers,
  };
}

// =========================================================
// ACCEPT BOOKING OFFER
// =========================================================

/**
 * Accepting an offer creates the assignment.
 *
 * The home collection lock guarantees that only one collector
 * can win a particular collection.
 *
 * The collector lock guarantees that simultaneous acceptances
 * cannot exceed the five-active-booking limit.
 */

export async function acceptMyCollectorBookingOffer(
  offerId: string,
  userId: string,
) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
  });

  if (!collector) {
    throw new Error("Collector not found for this user");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector account is inactive");
  }

  if (collector.qualificationStatus !== "VERIFIED") {
    throw new Error("Collector qualification is not verified");
  }

  if (!collector.isAvailable) {
    throw new Error("Collector is not currently available");
  }

  return prisma.$transaction(
    async (tx) => {
      const initialOffer = await tx.collectorBookingOffer.findUnique({
        where: { offerId },
      });

      if (!initialOffer) {
        throw new Error("Booking offer not found");
      }

      if (initialOffer.collectorId !== collector.collectorId) {
        throw new Error(
          "This booking offer does not belong to this collector",
        );
      }

      await lockHomeCollection(
        tx,
        initialOffer.homeCollectionId,
      );

      await lockCollector(tx, collector.collectorId);

      const offer = await tx.collectorBookingOffer.findUnique({
        where: { offerId },
        include: {
          homeCollection: {
            include: {
              appointment: true,
              collectorAssignment: true,
            },
          },
        },
      });

      if (!offer) {
        throw new Error("Booking offer not found");
      }

      if (offer.status !== "PENDING") {
        throw new Error("This booking offer is no longer available");
      }

      const now = new Date();

      if (offer.expiresAt && offer.expiresAt <= now) {
        await tx.collectorBookingOffer.update({
          where: { offerId },
          data: {
            status: "EXPIRED",
            respondedAt: now,
          },
        });

        throw new Error("This booking offer has expired");
      }

      const homeCollection = offer.homeCollection;

      if (
        homeCollection.status !== "PENDING" ||
        homeCollection.collectorAssignment
      ) {
        throw new Error(
          "Another collector has already accepted this booking",
        );
      }

      if (
        homeCollection.allocationStage !== "LAB_COLLECTORS" &&
        homeCollection.allocationStage !== "INDEPENDENT_POOL"
      ) {
        throw new Error("This booking is no longer accepting offers");
      }

      // Revalidate collector after acquiring the lock.
      const currentCollector = await tx.collector.findUnique({
        where: {
          collectorId: collector.collectorId,
        },
      });

      if (!currentCollector) {
        throw new Error("Collector not found");
      }

      if (
        currentCollector.status !== "ACTIVE" ||
        currentCollector.qualificationStatus !== "VERIFIED" ||
        !currentCollector.isAvailable
      ) {
        throw new Error(
          "Collector is no longer eligible to accept bookings",
        );
      }

      if (
        !currentCollector.lastLocationAt ||
        currentCollector.lastLocationAt <
          getFreshLocationThreshold()
      ) {
        throw new Error(
          "Please update your current location before accepting bookings",
        );
      }

      if (
        currentCollector.latitude === null ||
        currentCollector.longitude === null
      ) {
        throw new Error("Collector location is unavailable");
      }

      if (
        homeCollection.latitude === null ||
        homeCollection.longitude === null
      ) {
        throw new Error("Patient collection location is unavailable");
      }

      // Verify the collector belongs to the correct offer pool.
      if (
        currentCollector.collectorType === "LAB" &&
        (
          homeCollection.allocationStage !== "LAB_COLLECTORS" ||
          currentCollector.labId !== homeCollection.appointment.labId
        )
      ) {
        throw new Error(
          "This lab collector offer is no longer valid",
        );
      }

      if (
        currentCollector.collectorType === "INDEPENDENT" &&
        (
          homeCollection.allocationStage !== "INDEPENDENT_POOL" ||
          currentCollector.labId !== null
        )
      ) {
        throw new Error(
          "This independent collector offer is no longer valid",
        );
      }

      // Validate independent collector distance.
      if (currentCollector.collectorType === "INDEPENDENT") {
        const distanceKm = calculateDistanceKm(
          homeCollection.latitude,
          homeCollection.longitude,
          currentCollector.latitude,
          currentCollector.longitude,
        );

        if (distanceKm > INDEPENDENT_COLLECTOR_RADIUS_KM) {
          throw new Error(
            "Patient location is outside the 25 km collection radius",
          );
        }
      }

      // Check maximum active bookings.
      const activeBookingCount = await tx.collectorAssignment.count({
        where: {
          collectorId: currentCollector.collectorId,
          status: {
            in: [...ACTIVE_ASSIGNMENT_STATUSES],
          },
        },
      });

      if (
        activeBookingCount >= MAX_ACTIVE_BOOKINGS_PER_COLLECTOR
      ) {
        throw new Error(
          "You already have the maximum of five active bookings",
        );
      }

      const assignmentSource =
        currentCollector.collectorType === "INDEPENDENT"
          ? "INDEPENDENT_POOL"
          : "LAB_INTERNAL";

      // Create collector assignment.
      const assignment = await tx.collectorAssignment.create({
        data: {
          homeCollectionId: homeCollection.homeCollectionId,
          collectorId: currentCollector.collectorId,
          source: assignmentSource,
          status: "ACCEPTED",
          acceptedAt: now,
          assignedAt: now,
        },
      });

      // Update home collection status.
      await tx.homeCollection.update({
        where: {
          homeCollectionId: homeCollection.homeCollectionId,
        },
        data: {
          status: "ASSIGNED",
          allocationStage: "ASSIGNED",
          assignedAt: now,
        },
      });

      // Create tracking history.
      await tx.homeCollectionTracking.create({
        data: {
          homeCollectionId: homeCollection.homeCollectionId,
          status: "ASSIGNED",
          notes: `Collector accepted booking through ${assignmentSource}`,
        },
      });

      // Mark accepted offer.
      await tx.collectorBookingOffer.update({
        where: { offerId },
        data: {
          status: "ACCEPTED",
          respondedAt: now,
        },
      });

      // Expire all other pending offers for this booking.
      await tx.collectorBookingOffer.updateMany({
        where: {
          homeCollectionId: homeCollection.homeCollectionId,
          offerId: {
            not: offerId,
          },
          status: "PENDING",
        },
        data: {
          status: "EXPIRED",
          respondedAt: now,
        },
      });

      // IMPORTANT:
      // Fetch the assignment again after updating homeCollection.
      // This ensures the response contains the latest nested data.
      return tx.collectorAssignment.findUniqueOrThrow({
        where: {
          collectorAssignmentId:
            assignment.collectorAssignmentId,
        },
        include: {
          collector: true,
          homeCollection: {
            include: {
              appointment: appointmentWithLabAndTestReports,
            },
          },
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 20000,
    },
  );
}


// =========================================================
// REJECT BOOKING OFFER
// =========================================================

export async function rejectMyCollectorBookingOffer(
  offerId: string,
  userId: string,
) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: {
      collectorId: true,
      status: true,
    },
  });

  if (!collector) {
    throw new Error("Collector not found for this user");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector account is inactive");
  }

  return prisma.$transaction(async (tx) => {
    const offer = await tx.collectorBookingOffer.findUnique({
      where: { offerId },
    });

    if (!offer) {
      throw new Error("Booking offer not found");
    }

    if (offer.collectorId !== collector.collectorId) {
      throw new Error(
        "This booking offer does not belong to this collector",
      );
    }

    if (offer.status !== "PENDING") {
      throw new Error("Only pending offers can be rejected");
    }

    return tx.collectorBookingOffer.update({
      where: { offerId },
      data: {
        status: "REJECTED",
        respondedAt: new Date(),
      },
      include: {
        collector: true,
        homeCollection: true,
      },
    });
  });
}

// =========================================================
// COLLECTOR ASSIGNMENT - LEGACY ADMIN API
// =========================================================

/**
 * Direct assignment is disabled.
 *
 * All new assignments must be created by accepting a booking offer.
 * This prevents bypassing the offer process and the five-booking limit.
 */
export async function createCollectorAssignment(
  _data: CreateCollectorAssignmentInput,
) {
  throw new Error(
    "Direct collector assignment is disabled. Create booking offers and use the collector offer acceptance API.",
  );
}

export async function getCollectorAssignments() {
  return prisma.collectorAssignment.findMany({
    include: {
      collector: true,
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });
}

export async function getCollectorAssignmentById(
  collectorAssignmentId: string,
) {
  const assignment = await prisma.collectorAssignment.findUnique({
    where: { collectorAssignmentId },
    include: {
      collector: true,
      homeCollection: {
        include: {
          appointment: appointmentWithLabAndTestReports,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Collector assignment not found");
  }

  return assignment;
}

// =========================================================
// ASSIGNMENT STATUS UPDATE
// =========================================================

export async function updateCollectorAssignment(
  collectorAssignmentId: string,
  data: UpdateCollectorAssignmentInput,
) {
  if (!data.status) {
    throw new Error("Assignment status is required");
  }

  if (data.status !== "COMPLETED") {
    throw new Error(
      "Assignment acceptance and rejection must happen through the booking offer APIs. Only assignment completion is supported here.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.collectorAssignment.findUnique({
      where: { collectorAssignmentId },
      include: {
        homeCollection: true,
      },
    });

    if (!existing) {
      throw new Error("Collector assignment not found");
    }

    if (existing.status !== "ACCEPTED") {
      throw new Error(
        "Only an accepted assignment can be completed",
      );
    }

    if (
      !["IN_LAB", "PROCESSING", "REPORT_READY", "COMPLETED"].includes(
        existing.homeCollection.status,
      )
    ) {
      throw new Error(
        "A collector assignment can be completed only after the samples reach the lab",
      );
    }

    return tx.collectorAssignment.update({
      where: { collectorAssignmentId },
      data: {
        status: "COMPLETED",
      },
      include: {
        collector: true,
        homeCollection: true,
      },
    });
  });
}

export async function deleteCollectorAssignment(
  collectorAssignmentId: string,
) {
  throw new Error(
    "Collector assignments cannot be deleted directly. Use the appropriate cancellation workflow.",
  );
}

// =========================================================
// HOME COLLECTION TRACKING
// =========================================================

export async function createHomeCollectionTracking(
  data: CreateHomeCollectionTrackingInput,
) {
  return prisma.$transaction(async (tx) => {
    const homeCollection = await tx.homeCollection.findUnique({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
    });

    if (!homeCollection) {
      throw new Error("Home collection not found");
    }

    if (data.status === "ASSIGNED") {
      throw new Error(
        "ASSIGNED tracking is created automatically when a collector accepts an offer",
      );
    }

    const current = homeCollection.status as HomeCollectionStatus;

    validateHomeCollectionTransition(current, data.status);

    if (current === data.status) {
      throw new Error(
        `Home collection is already in status ${data.status}`,
      );
    }

    const tracking = await tx.homeCollectionTracking.create({
      data: {
        homeCollectionId: data.homeCollectionId,
        status: data.status,
        notes: data.notes,
      },
    });

    await tx.homeCollection.update({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
      data: {
        status: data.status,
        ...getHomeCollectionTimestamps(data.status),
      },
    });

    return tracking;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

export async function getHomeCollectionTracking(
  homeCollectionId: string,
) {
  const homeCollection = await prisma.homeCollection.findUnique({
    where: { homeCollectionId },
  });

  if (!homeCollection) {
    throw new Error("Home collection not found");
  }

  return prisma.homeCollectionTracking.findMany({
    where: { homeCollectionId },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getHomeCollectionTrackingById(
  trackingId: string,
) {
  const tracking = await prisma.homeCollectionTracking.findUnique({
    where: { trackingId },
    include: {
      homeCollection: true,
    },
  });

  if (!tracking) {
    throw new Error("Tracking record not found");
  }

  return tracking;
}

// =========================================================
// COLLECTOR BOOKINGS
// =========================================================

export async function getCollectorBookings(collectorId: string) {
  const collector = await prisma.collector.findUnique({
    where: { collectorId },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  return prisma.collectorAssignment.findMany({
    where: {
      collectorId,
      status: {
        in: [...ACTIVE_ASSIGNMENT_STATUSES],
      },
    },
    include: collectorBookingInclude,
    orderBy: {
      assignedAt: "desc",
    },
  });
}

export async function getCollectorHistory(collectorId: string) {
  const collector = await prisma.collector.findUnique({
    where: { collectorId },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  return prisma.collectorAssignment.findMany({
    where: {
      collectorId,
      status: {
        in: ["COMPLETED", "CANCELLED", "REJECTED"],
      },
    },
    include: collectorBookingInclude,
    orderBy: {
      assignedAt: "desc",
    },
  });
}

// =========================================================
// LEGACY ASSIGNMENT ACCEPTANCE - DISABLED
// =========================================================

export async function acceptCollectorAssignment(
  _collectorAssignmentId: string,
  _collectorId: string,
) {
  throw new Error(
    "Direct assignment acceptance is disabled. Accept a booking offer instead.",
  );
}

// =========================================================
// AUTHENTICATED COLLECTOR BOOKINGS
// =========================================================

export async function getMyCollectorBookings(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: { userId },
    select: {
      collectorId: true,
      userId: true,
      name: true,
      labId: true,
      collectorType: true,
      status: true,
      qualificationStatus: true,
      isAvailable: true,
    },
  });

  if (!collector) {
    throw new Error("Collector not found for this user");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector account is inactive");
  }

  const [assignments, offers] = await Promise.all([
    prisma.collectorAssignment.findMany({
      where: {
        collectorId: collector.collectorId,
        status: {
          in: [...ACTIVE_ASSIGNMENT_STATUSES],
        },
      },
      include: collectorBookingInclude,
      orderBy: {
        assignedAt: "desc",
      },
    }),
    prisma.collectorBookingOffer.findMany({
      where: {
        collectorId: collector.collectorId,
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        homeCollection: {
          is: {
            status: "PENDING",
            collectorAssignment: {
              is: null,
            },
          },
        },
      },
      include: {
        homeCollection: {
          include: {
            appointment: appointmentWithLabAndTestReports,
            samples: true,
          },
        },
      },
      orderBy: {
        offeredAt: "desc",
      },
    }),
  ]);

  return {
    collector,
    total: assignments.length + offers.length,
    assignments,
    offers,
  };
}

// =========================================================
// LEGACY AUTHENTICATED ASSIGNMENT ACCEPTANCE - DISABLED
// =========================================================

export async function acceptMyCollectorAssignment(
  _collectorAssignmentId: string,
  _userId: string,
) {
  throw new Error(
    "Direct assignment acceptance is disabled. Use acceptMyCollectorBookingOffer instead.",
  );
}

export async function rejectMyCollectorAssignment(
  _collectorAssignmentId: string,
  _userId: string,
) {
  throw new Error(
    "Direct assignment rejection is disabled. Use rejectMyCollectorBookingOffer instead.",
  );
}

// =========================================================
// LAB HOME COLLECTION SUMMARY
// =========================================================

export async function getHomeCollectionSummary(
  labUserId: string,
) {
  const lab = await prisma.lab.findFirst({
    where: { labUserId },
    select: { labId: true },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  const statuses = [
    "PENDING",
    "ASSIGNED",
    "EN_ROUTE",
    "SAMPLE_COLLECTED",
    "IN_LAB",
    "PROCESSING",
    "REPORT_READY",
    "COMPLETED",
    "CANCELLED",
  ] as const;

  const [
    total,
    grouped,
    allocationGrouped,
  ] = await Promise.all([
    prisma.homeCollection.count({
      where: {
        appointment: {
          labId: lab.labId,
        },
      },
    }),
    prisma.homeCollection.groupBy({
      by: ["status"],
      where: {
        appointment: {
          labId: lab.labId,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.homeCollection.groupBy({
      by: ["allocationStage"],
      where: {
        appointment: {
          labId: lab.labId,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const counts = Object.fromEntries(
    statuses.map((status) => [status, 0]),
  ) as Record<(typeof statuses)[number], number>;

  for (const item of grouped) {
    counts[item.status] = item._count._all;
  }

  const allocationCounts = {
    LAB_COLLECTORS: 0,
    INDEPENDENT_POOL: 0,
    ASSIGNED: 0,
  };

  for (const item of allocationGrouped) {
    allocationCounts[item.allocationStage] = item._count._all;
  }

  return {
    total,
    counts,
    allocationCounts,
  };
}

// =========================================================
// LAB HOME COLLECTION HISTORY
// =========================================================

export async function getHomeCollectionHistory(
  homeCollectionId: string,
  labUserId: string,
) {
  const lab = await prisma.lab.findFirst({
    where: { labUserId },
    select: { labId: true },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  const collection = await prisma.homeCollection.findFirst({
    where: {
      homeCollectionId,
      appointment: {
        is: {
          labId: lab.labId,
        },
      },
    },
    include: homeCollectionDetailsInclude,
  });

  if (!collection) {
    throw new Error("Home collection not found");
  }

  return collection;
}
