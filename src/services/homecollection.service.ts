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
  status?: "ASSIGNED" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
}

export interface UpdateCollectorAssignmentInput {
  status?: "ASSIGNED" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
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
      "Home collection can only be created for HOME appointment",
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

  return prisma.homeCollection.create({
    data: {
      appointmentId: data.appointmentId,
      address: data.address,
      specialInstructions: data.specialInstructions,
      status: data.status,
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

  const homeCollection =
    await prisma.homeCollection.findUnique({
      where: {
        appointmentId,
      },
      include: {
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
  const homeCollection =
    await prisma.homeCollection.findUnique({
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
  const existing =
    await prisma.homeCollection.findUnique({
      where: {
        homeCollectionId,
      },
    });

  if (!existing) {
    throw new Error("Home collection not found");
  }

  return prisma.homeCollection.update({
    where: {
      homeCollectionId,
    },
    data: {
      address: data.address,
      specialInstructions: data.specialInstructions,
      status: data.status,

      assignedAt: data.assignedAt
        ? new Date(data.assignedAt)
        : undefined,

      collectedAt: data.collectedAt
        ? new Date(data.collectedAt)
        : undefined,

      completedAt: data.completedAt
        ? new Date(data.completedAt)
        : undefined,
    },
  });
}

// =========================================================
// COLLECTOR
// =========================================================

export async function createCollector(
  data: CreateCollectorInput,
) {
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
      qualificationStatus: data.qualificationStatus,
      status: data.status,
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

export async function getCollectorsByLab(
  labId: string,
) {
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

export async function getCollectorById(
  collectorId: string,
) {
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
export async function deleteCollector(
  collectorId: string,
) {
  const existing = await prisma.collector.findUnique({
    where: {
      collectorId,
    },
  });

  if (!existing) {
    throw new Error("Collector not found");
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
  const homeCollection =
    await prisma.homeCollection.findUnique({
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

  if (!homeCollection.appointment.labId) {
    throw new Error(
      "Home collection appointment does not have labId",
    );
  }

  const collector = await prisma.collector.findUnique({
    where: {
      collectorId: data.collectorId,
    },
  });

  if (!collector) {
    throw new Error("Collector not found");
  }

  if (
    collector.labId !== homeCollection.appointment.labId
  ) {
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

  const existing =
    await prisma.collectorAssignment.findUnique({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
    });

  if (existing) {
    throw new Error(
      "A collector is already assigned to this home collection",
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const assignment =
        await tx.collectorAssignment.create({
          data: {
            homeCollectionId: data.homeCollectionId,
            collectorId: data.collectorId,
            status: data.status,
          },
          include: {
            collector: true,
            homeCollection: true,
          },
        });

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
    },
  );

  return result;
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
  const assignment =
    await prisma.collectorAssignment.findUnique({
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
  const existing =
    await prisma.collectorAssignment.findUnique({
      where: {
        collectorAssignmentId,
      },
    });

  if (!existing) {
    throw new Error("Collector assignment not found");
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const assignment =
        await tx.collectorAssignment.update({
          where: {
            collectorAssignmentId,
          },
          data: {
            status: data.status,
          },
        });

      if (data.status === "CANCELLED") {
        await tx.homeCollection.update({
          where: {
            homeCollectionId: existing.homeCollectionId,
          },
          data: {
            status: "CANCELLED",
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
    },
  );

  return result;
}

export async function deleteCollectorAssignment(
  collectorAssignmentId: string,
) {
  const existing =
    await prisma.collectorAssignment.findUnique({
      where: {
        collectorAssignmentId,
      },
    });

  if (!existing) {
    throw new Error("Collector assignment not found");
  }

  return prisma.collectorAssignment.delete({
    where: {
      collectorAssignmentId,
    },
  });
}

// =========================================================
// HOME COLLECTION TRACKING
// =========================================================

export async function createHomeCollectionTracking(
  data: CreateHomeCollectionTrackingInput,
) {
  const homeCollection =
    await prisma.homeCollection.findUnique({
      where: {
        homeCollectionId: data.homeCollectionId,
      },
    });

  if (!homeCollection) {
    throw new Error("Home collection not found");
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const tracking =
        await tx.homeCollectionTracking.create({
          data: {
            homeCollectionId: data.homeCollectionId,
            status: data.status,
            notes: data.notes,
          },
        });

      const updateData: any = {
        status: data.status,
      };

      if (data.status === "SAMPLE_COLLECTED") {
        updateData.collectedAt = new Date();
      }

      if (data.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }

      await tx.homeCollection.update({
        where: {
          homeCollectionId: data.homeCollectionId,
        },
        data: updateData,
      });

      return tracking;
    },
  );

  return result;
}

export async function getHomeCollectionTracking(
  homeCollectionId: string,
) {
  const homeCollection =
    await prisma.homeCollection.findUnique({
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
  const tracking =
    await prisma.homeCollectionTracking.findUnique({
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