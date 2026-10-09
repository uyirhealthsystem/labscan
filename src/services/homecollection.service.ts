import { prisma } from "./prisma.service";

// =========================================================
// INPUT TYPES
// =========================================================

export interface CreateHomeCollectionInput {
  appointmentId: string;
  address: string;
  specialInstructions?: string;
  status?:
    | "PENDING"
    | "ASSIGNED"
    | "EN_ROUTE"
    | "SAMPLE_COLLECTED"
    | "IN_LAB"
    | "PROCESSING"
    | "REPORT_READY"
    | "COMPLETED"
    | "CANCELLED";
}

export interface UpdateHomeCollectionInput {
  address?: string;
  specialInstructions?: string;
  status?:
    | "PENDING"
    | "ASSIGNED"
    | "EN_ROUTE"
    | "SAMPLE_COLLECTED"
    | "IN_LAB"
    | "PROCESSING"
    | "REPORT_READY"
    | "COMPLETED"
    | "CANCELLED";
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
  status?:
    | "ASSIGNED"
    | "ACCEPTED"
    | "REJECTED"
    | "COMPLETED"
    | "CANCELLED";
}

export interface CreateHomeCollectionTrackingInput {
  homeCollectionId: string;
  status:
    | "ASSIGNED"
    | "EN_ROUTE"
    | "SAMPLE_COLLECTED"
    | "IN_LAB"
    | "PROCESSING"
    | "REPORT_READY"
    | "COMPLETED";
  notes?: string;
}

// =========================================================
// HOME COLLECTION STATUS VALIDATION
// =========================================================

type HomeCollectionStatus =
  | "PENDING"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "SAMPLE_COLLECTED"
  | "IN_LAB"
  | "PROCESSING"
  | "REPORT_READY"
  | "COMPLETED"
  | "CANCELLED";

const allowedTransitions: Record<
  HomeCollectionStatus,
  HomeCollectionStatus[]
> = {
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
  currentStatus: HomeCollectionStatus,
  nextStatus: HomeCollectionStatus,
) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new Error(
      `Invalid home collection status transition: ${currentStatus} -> ${nextStatus}`,
    );
  }
}

function getHomeCollectionTimestamps(
  status: HomeCollectionStatus,
) {
  const now = new Date();

  return {
    ...(status === "ASSIGNED" && { assignedAt: now }),
    ...(status === "SAMPLE_COLLECTED" && { collectedAt: now }),
    ...(status === "COMPLETED" && { completedAt: now }),
  };
}

// =========================================================
// HOME COLLECTION
// =========================================================

export async function createHomeCollection(
  data: CreateHomeCollectionInput,
) {
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

  const existing = await prisma.homeCollection.findUnique({
    where: {
      appointmentId: data.appointmentId,
    },
  });

  if (existing) {
    throw new Error(
      "Home collection already exists for this appointment",
    );
  }

  // Always start a new collection as PENDING.
  // The workflow changes its status after assignment.
  return prisma.homeCollection.create({
    data: {
      appointmentId: data.appointmentId,
      address: data.address,
      specialInstructions: data.specialInstructions,
      status: "PENDING",
    },
    include: {
      appointment: {
        include: {
          patient: true,
          lab: true,
        },
      },
    },
  });
}

export async function getHomeCollections() {
  return prisma.homeCollection.findMany({
    include: {
      appointment: {
        include: {
          patient: true,
          lab: true,
        },
      },
      collectorAssignment: {
        include: {
          collector: true,
        },
      },
      trackingEvents: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getHomeCollectionByAppointmentId(
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

  const homeCollection = await prisma.homeCollection.findUnique({
    where: {
      appointmentId,
    },
    include: {
      appointment: {
        include: {
          patient: true,
          lab: true,
        },
      },
      collectorAssignment: {
        include: {
          collector: true,
        },
      },
      trackingEvents: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
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
    where: {
      homeCollectionId,
    },
    include: {
      appointment: {
        include: {
          patient: true,
          lab: true,
        },
      },
      collectorAssignment: {
        include: {
          collector: true,
        },
      },
      trackingEvents: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!homeCollection) {
    throw new Error("Home collection not found");
  }

  return homeCollection;
}

export async function updateHomeCollection(
  homeCollectionId: string,
  data: UpdateHomeCollectionInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.homeCollection.findUnique({
      where: {
        homeCollectionId,
      },
    });

    if (!existing) {
      throw new Error("Home collection not found");
    }

    if (data.status) {
      validateHomeCollectionTransition(
        existing.status as HomeCollectionStatus,
        data.status,
      );
    }

    const status = data.status;

    return tx.homeCollection.update({
      where: {
        homeCollectionId,
      },
      data: {
        address: data.address,
        specialInstructions: data.specialInstructions,
        ...(status && { status }),
        ...(status && getHomeCollectionTimestamps(status)),
      },
    });
  });
}

// =========================================================
// COLLECTOR
// =========================================================

export async function createCollector(data: CreateCollectorInput) {
  const lab = await prisma.lab.findUnique({
    where: {
      labId: data.labId,
    },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

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
    include: {
      assignments: true,
    },
  });
}

export async function getCollectors() {
  return prisma.collector.findMany({
    include: {
      assignments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCollectorsByLab(labId: string) {
  const lab = await prisma.lab.findUnique({
    where: {
      labId,
    },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  return prisma.collector.findMany({
    where: {
      labId,
    },
    include: {
      assignments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCollectorById(collectorId: string) {
  const collector = await prisma.collector.findUnique({
    where: {
      collectorId,
    },
    include: {
      assignments: {
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

export async function updateCollector(
  collectorId: string,
  data: UpdateCollectorInput,
) {
  const existing = await prisma.collector.findUnique({
    where: {
      collectorId,
    },
  });

  if (!existing) {
    throw new Error("Collector not found");
  }

  return prisma.collector.update({
    where: {
      collectorId,
    },
    data: {
      name: data.name,
      phone: data.phone,
      role: data.role,
      qualification: data.qualification,
      qualificationNumber: data.qualificationNumber,
      qualificationProofUrl: data.qualificationProofUrl,
      qualificationStatus: data.qualificationStatus,
      status: data.status,
    },
  });
}

export async function deleteCollector(collectorId: string) {
  const existing = await prisma.collector.findUnique({
    where: {
      collectorId,
    },
    include: {
      assignments: true,
    },
  });

  if (!existing) {
    throw new Error("Collector not found");
  }

  const activeAssignments = existing.assignments.filter(
    (assignment) =>
      assignment.status === "ASSIGNED" ||
      assignment.status === "ACCEPTED",
  );

  if (activeAssignments.length > 0) {
    throw new Error(
      "Cannot delete a collector with active assignments",
    );
  }

  return prisma.collector.delete({
    where: {
      collectorId,
    },
  });
}

// =========================================================
// COLLECTOR ASSIGNMENT
// =========================================================

export async function createCollectorAssignment(
  data: CreateCollectorAssignmentInput,
) {
  return prisma.$transaction(async (tx) => {
    const homeCollection = await tx.homeCollection.findUnique({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
      include: {
        appointment: true,
      },
    });

    if (!homeCollection) {
      throw new Error("Home collection not found");
    }

    if (
      homeCollection.status === "COMPLETED" ||
      homeCollection.status === "CANCELLED"
    ) {
      throw new Error(
        "Cannot assign a collector to a completed or cancelled collection",
      );
    }

    const labId = homeCollection.appointment.labId;

    if (!labId) {
      throw new Error(
        "Home collection appointment does not have labId",
      );
    }

    const collector = await tx.collector.findUnique({
      where: {
        collectorId: data.collectorId,
      },
    });

    if (!collector) {
      throw new Error("Collector not found");
    }

    if (collector.labId !== labId) {
      throw new Error(
        "Collector does not belong to the appointment lab",
      );
    }

    if (collector.status !== "ACTIVE") {
      throw new Error("Collector is not active");
    }

    if (collector.qualificationStatus !== "VERIFIED") {
      throw new Error(
        "Collector qualification is not verified",
      );
    }

    const existing = await tx.collectorAssignment.findUnique({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
    });

    let assignment;

    if (existing) {
      if (
        existing.status !== "REJECTED" &&
        existing.status !== "CANCELLED"
      ) {
        throw new Error(
          "A collector is already assigned to this home collection",
        );
      }

      // The schema permits only one assignment per home collection.
      // Reuse the record to assign a replacement collector.
      assignment = await tx.collectorAssignment.update({
        where: {
          collectorAssignmentId: existing.collectorAssignmentId,
        },
        data: {
          collectorId: data.collectorId,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
        include: {
          collector: true,
          homeCollection: true,
        },
      });
    } else {
      assignment = await tx.collectorAssignment.create({
        data: {
          homeCollectionId: data.homeCollectionId,
          collectorId: data.collectorId,
          status: "ASSIGNED",
        },
        include: {
          collector: true,
          homeCollection: true,
        },
      });
    }

    await tx.homeCollection.update({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
      data: {
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });

      return assignment;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}


export async function getCollectorAssignments() {
  return prisma.collectorAssignment.findMany({
    include: {
      collector: true,
      homeCollection: {
        include: {
          appointment: {
            include: {
              patient: true,
              lab: true,
            },
          },
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
    where: {
      collectorAssignmentId,
    },
    include: {
      collector: true,
      homeCollection: {
        include: {
          appointment: {
            include: {
              patient: true,
              lab: true,
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Collector assignment not found");
  }

  return assignment;
}

export async function updateCollectorAssignment(
  collectorAssignmentId: string,
  data: UpdateCollectorAssignmentInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.collectorAssignment.findUnique({
      where: {
        collectorAssignmentId,
      },
      include: {
        homeCollection: true,
      },
    });

    if (!existing) {
      throw new Error("Collector assignment not found");
    }

    if (!data.status) {
      throw new Error("Assignment status is required");
    }

    if (
      existing.status === "COMPLETED" ||
      existing.status === "CANCELLED" ||
      existing.status === "REJECTED"
    ) {
      throw new Error(
        "This assignment is already in a final state",
      );
    }

    const assignment = await tx.collectorAssignment.update({
      where: {
        collectorAssignmentId,
      },
      data: {
        status: data.status,
      },
    });

    if (
      data.status === "REJECTED" ||
      data.status === "CANCELLED"
    ) {
      await tx.homeCollection.update({
        where: {
          homeCollectionId: existing.homeCollectionId,
        },
        data: {
          status: "PENDING",
          assignedAt: null,
        },
      });
    }

    if (data.status === "COMPLETED") {
      await tx.homeCollection.update({
        where: {
          homeCollectionId: existing.homeCollectionId,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    return assignment;
  });
}

export async function deleteCollectorAssignment(
  collectorAssignmentId: string,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.collectorAssignment.findUnique({
      where: {
        collectorAssignmentId,
      },
    });

    if (!existing) {
      throw new Error("Collector assignment not found");
    }

    if (
      existing.status === "ACCEPTED" ||
      existing.status === "COMPLETED"
    ) {
      throw new Error(
        "Cannot delete an accepted or completed assignment",
      );
    }

    const deleted = await tx.collectorAssignment.delete({
      where: {
        collectorAssignmentId,
      },
    });

    await tx.homeCollection.update({
      where: {
        homeCollectionId: existing.homeCollectionId,
      },
      data: {
        status: "PENDING",
        assignedAt: null,
      },
    });

    return deleted;
  });
}

// =========================================================
// HOME COLLECTION TRACKING
// =========================================================


export async function createHomeCollectionTracking(
  data: CreateHomeCollectionTrackingInput,
) {
  return prisma.$transaction(
    async (tx) => {
      const homeCollection = await tx.homeCollection.findUnique({
        where: {
          homeCollectionId: data.homeCollectionId,
        },
      });

      if (!homeCollection) {
        throw new Error("Home collection not found");
      }

      validateHomeCollectionTransition(
        homeCollection.status as HomeCollectionStatus,
        data.status,
      );

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
    },
    {
      maxWait: 10000,
      timeout: 20000,
    },
  );
}

export async function getHomeCollectionTracking(
  homeCollectionId: string,
) {
  const homeCollection = await prisma.homeCollection.findUnique({
    where: {
      homeCollectionId,
    },
  });

  if (!homeCollection) {
    throw new Error("Home collection not found");
  }

  return prisma.homeCollectionTracking.findMany({
    where: {
      homeCollectionId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getHomeCollectionTrackingById(
  trackingId: string,
) {
  const tracking = await prisma.homeCollectionTracking.findUnique({
    where: {
      trackingId,
    },
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
// COLLECTOR BOOKINGS AND HISTORY
// =========================================================

export async function getCollectorBookings(collectorId: string) {
  const collector = await prisma.collector.findUnique({
    where: {
      collectorId,
    },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  return prisma.collectorAssignment.findMany({
    where: {
      collectorId,
      status: {
        in: ["ASSIGNED", "ACCEPTED"],
      },
    },
    include: {
      collector: true,
      homeCollection: {
        include: {
          appointment: {
            include: {
              patient: true,
              lab: true,
            },
          },
          trackingEvents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });
}

export async function getCollectorHistory(collectorId: string) {
  const collector = await prisma.collector.findUnique({
    where: {
      collectorId,
    },
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
    include: {
      homeCollection: {
        include: {
          appointment: {
            include: {
              patient: true,
              lab: true,
            },
          },
          trackingEvents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });
}

// Legacy function for callers that already have a collectorId.
// Prefer acceptMyCollectorAssignment for authenticated API requests.
export async function acceptCollectorAssignment(
  collectorAssignmentId: string,
  collectorId: string,
) {
  const collector = await prisma.collector.findUnique({
    where: {
      collectorId,
    },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector is not active");
  }

  if (collector.qualificationStatus !== "VERIFIED") {
    throw new Error("Collector qualification is not verified");
  }

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.collectorAssignment.findUnique({
      where: {
        collectorAssignmentId,
      },
    });

    if (!assignment) {
      throw new Error("Collector assignment not found");
    }

    if (assignment.collectorId !== collectorId) {
      throw new Error(
        "This assignment does not belong to this collector",
      );
    }

    if (assignment.status !== "ASSIGNED") {
      throw new Error("Only assigned bookings can be accepted");
    }

    return tx.collectorAssignment.update({
      where: {
        collectorAssignmentId,
      },
      data: {
        status: "ACCEPTED",
      },
      include: {
        collector: true,
        homeCollection: {
          include: {
            appointment: {
              include: {
                patient: true,
                lab: true,
              },
            },
          },
        },
      },
    });
  });
}

// =========================================================
// AUTHENTICATED COLLECTOR APIS
// =========================================================

export async function getMyCollectorBookings(userId: string) {
  const collector = await prisma.collector.findUnique({
    where: {
      userId,
    },
    select: {
      collectorId: true,
      userId: true,
      name: true,
      labId: true,
      status: true,
      qualificationStatus: true,
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
      status: {
        in: ["ASSIGNED", "ACCEPTED"],
      },
    },
    include: {
      homeCollection: {
        include: {
          appointment: {
            include: {
              patient: true,
              tests: {
                include: {
                  labTest: {
                    include: {
                      testCatalog: true,
                    },
                  },
                  samples: true,
                },
              },
              services: {
                include: {
                  scanService: {
                    include: {
                      serviceCatalog: true,
                    },
                  },
                },
              },
            },
          },
          samples: true,
          trackingEvents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });

  return {
    collector,
    total: assignments.length,
    assignments,
  };
}

export async function acceptMyCollectorAssignment(
  collectorAssignmentId: string,
  userId: string,
) {
  const collector = await prisma.collector.findUnique({
    where: {
      userId,
    },
    select: {
      collectorId: true,
      status: true,
      qualificationStatus: true,
    },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector is not active");
  }

  if (collector.qualificationStatus !== "VERIFIED") {
    throw new Error("Collector qualification is not verified");
  }

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.collectorAssignment.findUnique({
      where: {
        collectorAssignmentId,
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.collectorId !== collector.collectorId) {
      throw new Error(
        "Assignment does not belong to this collector",
      );
    }

    if (assignment.status !== "ASSIGNED") {
      throw new Error("Only assigned bookings can be accepted");
    }

    return tx.collectorAssignment.update({
      where: {
        collectorAssignmentId,
      },
      data: {
        status: "ACCEPTED",
      },
      include: {
        homeCollection: true,
        collector: true,
      },
    });
  });
}

export async function rejectMyCollectorAssignment(
  collectorAssignmentId: string,
  userId: string,
) {
  const collector = await prisma.collector.findUnique({
    where: {
      userId,
    },
    select: {
      collectorId: true,
      status: true,
    },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  if (collector.status !== "ACTIVE") {
    throw new Error("Collector is not active");
  }

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.collectorAssignment.findUnique({
      where: {
        collectorAssignmentId,
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.collectorId !== collector.collectorId) {
      throw new Error(
        "Assignment does not belong to this collector",
      );
    }

    if (
      assignment.status !== "ASSIGNED" &&
      assignment.status !== "ACCEPTED"
    ) {
      throw new Error("This assignment cannot be rejected");
    }

    const rejected = await tx.collectorAssignment.update({
      where: {
        collectorAssignmentId,
      },
      data: {
        status: "REJECTED",
      },
      include: {
        homeCollection: true,
        collector: true,
      },
    });

    await tx.homeCollection.update({
      where: {
        homeCollectionId: assignment.homeCollectionId,
      },
      data: {
        status: "PENDING",
        assignedAt: null,
      },
    });

    return rejected;
  });
}



export async function getHomeCollectionSummary(labUserId: string) {
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

  const [total, grouped] = await Promise.all([
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
  ]);

  const counts = Object.fromEntries(
    statuses.map((status) => [status, 0]),
  ) as Record<(typeof statuses)[number], number>;

  for (const item of grouped) {
    counts[item.status] = item._count._all;
  }

  return {
    total,
    counts,
  };
}


export async function getHomeCollectionHistory(
  homeCollectionId: string,
  labUserId: string,
) {
  // Verify that the authenticated user belongs to a lab.
  const lab = await prisma.lab.findFirst({
    where: { labUserId },
    select: { labId: true },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  // Restrict access to collections belonging to this lab.
  const collection = await prisma.homeCollection.findFirst({
    where: {
      homeCollectionId,
      appointment: {
        is: {
          labId: lab.labId,
        },
      },
    },
    include: {
      appointment: {
        include: {
          patient: true,
          tests: {
            include: {
              labTest: {
                include: {
                  testCatalog: true,
                },
              },
              samples: true,
            },
          },
        },
      },
      collectorAssignment: {
        include: {
          collector: true,
        },
      },
      trackingEvents: {
        orderBy: {
          createdAt: "asc",
        },
      },
      samples: {
        include: {
          trackingEvents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!collection) {
    throw new Error("Home collection not found");
  }

  return collection;
}