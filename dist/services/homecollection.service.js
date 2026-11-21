"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHomeCollection = createHomeCollection;
exports.acknowledgeHomeCollectionReceived = acknowledgeHomeCollectionReceived;
exports.assignLabCollectorToHomeCollection = assignLabCollectorToHomeCollection;
exports.getHomeCollections = getHomeCollections;
exports.getHomeCollectionByAppointmentId = getHomeCollectionByAppointmentId;
exports.getHomeCollectionById = getHomeCollectionById;
exports.updateHomeCollection = updateHomeCollection;
exports.createCollector = createCollector;
exports.getCollectors = getCollectors;
exports.getCollectorsByLab = getCollectorsByLab;
exports.getCollectorById = getCollectorById;
exports.getMyCollectorProfile = getMyCollectorProfile;
exports.updateMyCollectorLocation = updateMyCollectorLocation;
exports.getMyCollectorDashboard = getMyCollectorDashboard;
exports.getMyCollectorHistory = getMyCollectorHistory;
exports.updateCollector = updateCollector;
exports.deleteCollector = deleteCollector;
exports.escalateDueHomeCollections = escalateDueHomeCollections;
exports.getMyCollectorBookingOffers = getMyCollectorBookingOffers;
exports.acceptMyCollectorBookingOffer = acceptMyCollectorBookingOffer;
exports.rejectMyCollectorBookingOffer = rejectMyCollectorBookingOffer;
exports.createCollectorAssignment = createCollectorAssignment;
exports.getCollectorAssignments = getCollectorAssignments;
exports.getCollectorAssignmentById = getCollectorAssignmentById;
exports.updateCollectorAssignment = updateCollectorAssignment;
exports.deleteCollectorAssignment = deleteCollectorAssignment;
exports.createHomeCollectionTracking = createHomeCollectionTracking;
exports.getHomeCollectionTracking = getHomeCollectionTracking;
exports.getHomeCollectionTrackingById = getHomeCollectionTrackingById;
exports.getCollectorBookings = getCollectorBookings;
exports.getCollectorHistory = getCollectorHistory;
exports.acceptCollectorAssignment = acceptCollectorAssignment;
exports.getMyCollectorBookings = getMyCollectorBookings;
exports.acceptMyCollectorAssignment = acceptMyCollectorAssignment;
exports.rejectMyCollectorAssignment = rejectMyCollectorAssignment;
exports.getHomeCollectionSummary = getHomeCollectionSummary;
exports.getHomeCollectionHistory = getHomeCollectionHistory;
exports.pushHomeCollectionToIndependentPool = pushHomeCollectionToIndependentPool;
exports.getMyHomeCollectionBookings = getMyHomeCollectionBookings;
exports.getMyHomeCollectionHistory = getMyHomeCollectionHistory;
exports.getMyHomeCollectionById = getMyHomeCollectionById;
const prisma_service_1 = require("./prisma.service");
const apiError_1 = require("../utils/apiError");
// =========================================================
// CONSTANTS
// =========================================================
const LAB_OFFER_WINDOW_MINUTES = 5;
const INDEPENDENT_COLLECTOR_RADIUS_KM = 25;
const COLLECTOR_LOCATION_MAX_AGE_MINUTES = 10;
const MAX_ACTIVE_BOOKINGS_PER_COLLECTOR = 5;
const ACTIVE_ASSIGNMENT_STATUSES = ["ASSIGNED", "ACCEPTED"];
const ACTIVE_COLLECTION_STATUSES = [
    "ASSIGNED",
    "EN_ROUTE",
    "SAMPLE_COLLECTED",
    "IN_LAB",
];
const PATIENT_ACTIVE_HOME_COLLECTION_STATUSES = [
    "PENDING",
    "ASSIGNED",
    "EN_ROUTE",
    "SAMPLE_COLLECTED",
    "IN_LAB",
    "PROCESSING",
    "REPORT_READY",
];
const PATIENT_HOME_COLLECTION_HISTORY_STATUSES = [
    "COMPLETED",
    "CANCELLED",
];
const allowedTransitions = {
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
function validateHomeCollectionTransition(current, next) {
    if (current === next)
        return;
    if (!allowedTransitions[current]?.includes(next)) {
        throw new Error(`Invalid home collection status transition: ${current} -> ${next}`);
    }
}
function getHomeCollectionTimestamps(status) {
    const now = new Date();
    return {
        ...(status === "ASSIGNED" ? { assignedAt: now } : {}),
        ...(status === "SAMPLE_COLLECTED" ? { collectedAt: now } : {}),
        ...(status === "COMPLETED" ? { completedAt: now } : {}),
    };
}
function assertAppointmentCanHaveHomeCollection(status) {
    if (["CANCELLED", "COMPLETED", "RESCHEDULED"].includes(status)) {
        throw new Error(`Cannot create home collection for an appointment with status ${status}`);
    }
}
function validateCoordinates(latitude, longitude) {
    if (!Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180) {
        throw new Error("Valid latitude and longitude are required");
    }
}
// =========================================================
// DISTANCE
// =========================================================
function calculateDistanceKm(latitude1, longitude1, latitude2, longitude2) {
    const earthRadiusKm = 6371;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const latitudeDifference = toRadians(latitude2 - latitude1);
    const longitudeDifference = toRadians(longitude2 - longitude1);
    const value = Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(latitude1)) *
            Math.cos(toRadians(latitude2)) *
            Math.sin(longitudeDifference / 2) ** 2;
    const angularDistance = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
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
};
const homeCollectionDetailsInclude = {
    appointment: appointmentWithLabAndTestReports,
    confirmation: true,
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
            offeredAt: "desc",
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
            evidence: true,
        },
    },
};
const collectorBookingInclude = {
    collector: true,
    homeCollection: {
        include: {
            appointment: appointmentWithLabAndTestReports,
            samples: {
                include: {
                    trackingEvents: {
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                    evidence: true,
                },
            },
            trackingEvents: {
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    },
};
// =========================================================
// PATIENT HOME COLLECTION INCLUDE
// =========================================================
const patientHomeCollectionInclude = {
    appointment: appointmentWithLabAndTestReports,
    collectorAssignment: {
        include: {
            collector: {
                select: {
                    collectorId: true,
                    name: true,
                    phone: true,
                    role: true,
                    collectorType: true,
                },
            },
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
            evidence: true,
        },
    },
};
// =========================================================
// DATABASE LOCK HELPERS
// =========================================================
async function lockHomeCollection(tx, homeCollectionId) {
    await tx.$queryRaw `
    SELECT pg_advisory_xact_lock(
      hashtext(${homeCollectionId})::bigint
    )::text AS lock_result
  `;
}
async function lockCollector(tx, collectorId) {
    await tx.$queryRaw `
    SELECT pg_advisory_xact_lock(
      hashtext(${`collector:${collectorId}`})::bigint
    )::text AS lock_result
  `;
}
// =========================================================
// COLLECTOR ELIGIBILITY
// =========================================================
function getFreshLocationThreshold() {
    return new Date(Date.now() - COLLECTOR_LOCATION_MAX_AGE_MINUTES * 60 * 1000);
}
async function getEligibleIndependentCollectors() {
    return prisma_service_1.prisma.collector.findMany({
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
async function createIndependentCollectorOffers(tx, homeCollection) {
    if (homeCollection.latitude == null ||
        homeCollection.longitude == null) {
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
    const existingCollectorIds = new Set(existingOffers.map((offer) => offer.collectorId));
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
        .map((collector) => {
        const distanceKm = calculateDistanceKm(homeCollection.latitude, homeCollection.longitude, collector.latitude, collector.longitude);
        return {
            collectorId: collector.collectorId,
            homeCollectionId: homeCollection.homeCollectionId,
            distanceKm,
        };
    })
        .filter((offer) => offer.distanceKm <= INDEPENDENT_COLLECTOR_RADIUS_KM &&
        !existingCollectorIds.has(offer.collectorId));
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
async function createHomeCollection(data) {
    validateCoordinates(data.latitude, data.longitude);
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId: data.appointmentId },
        include: { lab: true },
    });
    if (!appointment)
        throw new Error("Appointment not found");
    if (appointment.appointmentType !== "LAB") {
        throw new Error("Home collection is only available for LAB appointments");
    }
    if (appointment.appointmentMode !== "HOME") {
        throw new Error("Home collection can only be created for HOME appointments");
    }
    assertAppointmentCanHaveHomeCollection(appointment.status);
    if (!appointment.labId)
        throw new Error("Appointment does not have a selected lab");
    return prisma_service_1.prisma.$transaction(async (tx) => {
        const existing = await tx.homeCollection.findUnique({
            where: { appointmentId: data.appointmentId },
            include: { confirmation: true },
        });
        if (existing) {
            throw new Error("Home collection already exists for this appointment");
        }
        const homeCollection = await tx.homeCollection.create({
            data: {
                appointmentId: data.appointmentId,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
                specialInstructions: data.specialInstructions,
                status: "PENDING",
                allocationStage: "LAB_COLLECTORS",
                // The lab timer starts only after its acknowledgement.
                matchingStartedAt: null,
                assignmentDeadline: null,
                confirmation: {
                    create: {
                        status: "PENDING",
                        recipientPhone: null,
                        payload: {
                            appointmentId: appointment.appointmentId,
                            labId: appointment.labId,
                            address: data.address,
                            bookingCreatedAt: new Date().toISOString(),
                        },
                    },
                },
            },
            include: { confirmation: true },
        });
        return {
            ...homeCollection,
            allocationStage: "LAB_COLLECTORS",
            timerStarted: false,
            message: "Booking created. The lab must acknowledge it to start the five-minute assignment window.",
        };
    }, { maxWait: 10000, timeout: 20000 });
}
/**
 * Lab acknowledges receipt of a citizen's home-collection booking.
 * This is the only operation that starts the five-minute lab assignment timer.
 */
async function acknowledgeHomeCollectionReceived(homeCollectionId, labUserId) {
    return prisma_service_1.prisma.$transaction(async (tx) => {
        await lockHomeCollection(tx, homeCollectionId);
        const lab = await tx.lab.findFirst({
            where: { labUserId },
            select: { labId: true },
        });
        if (!lab)
            throw new Error("Lab not found for the logged-in user");
        const collection = await tx.homeCollection.findUnique({
            where: { homeCollectionId },
            include: { appointment: true, collectorAssignment: true },
        });
        if (!collection)
            throw new Error("Home collection not found");
        if (collection.appointment.labId !== lab.labId) {
            throw new Error("This booking does not belong to your lab");
        }
        if (collection.collectorAssignment || collection.status !== "PENDING") {
            throw new Error("This booking is no longer awaiting lab acknowledgement");
        }
        // Idempotent acknowledgement: repeated calls do not reset the deadline.
        if (collection.matchingStartedAt && collection.assignmentDeadline) {
            return {
                homeCollection: collection,
                alreadyAcknowledged: true,
                assignmentDeadline: collection.assignmentDeadline,
            };
        }
        const now = new Date();
        const deadline = new Date(now.getTime() + LAB_OFFER_WINDOW_MINUTES * 60 * 1000);
        const updated = await tx.homeCollection.update({
            where: { homeCollectionId },
            data: {
                matchingStartedAt: now,
                assignmentDeadline: deadline,
                firstReminderSentAt: null,
                finalReminderSentAt: null,
            },
            include: homeCollectionDetailsInclude,
        });
        return {
            homeCollection: updated,
            alreadyAcknowledged: false,
            assignmentDeadline: deadline,
            assignmentWindowMinutes: LAB_OFFER_WINDOW_MINUTES,
        };
    }, { maxWait: 10000, timeout: 20000 });
}
/**
 * Lab directly assigns one of its own verified, active collectors.
 * Lab collectors never receive booking offers.
 */
async function assignLabCollectorToHomeCollection(homeCollectionId, collectorId, labUserId) {
    return prisma_service_1.prisma.$transaction(async (tx) => {
        await lockHomeCollection(tx, homeCollectionId);
        const lab = await tx.lab.findFirst({
            where: { labUserId },
            select: { labId: true },
        });
        if (!lab)
            throw new Error("Lab not found for the logged-in user");
        const collection = await tx.homeCollection.findUnique({
            where: { homeCollectionId },
            include: { appointment: true, collectorAssignment: true },
        });
        if (!collection)
            throw new Error("Home collection not found");
        if (collection.appointment.labId !== lab.labId) {
            throw new Error("This booking does not belong to your lab");
        }
        if (collection.status !== "PENDING" || collection.collectorAssignment) {
            throw new Error("This booking is not available for assignment");
        }
        if (collection.allocationStage !== "LAB_COLLECTORS") {
            throw new Error("The lab assignment window has ended; this booking is in the independent pool");
        }
        if (!collection.matchingStartedAt || !collection.assignmentDeadline) {
            throw new Error("Acknowledge the booking before assigning a lab collector");
        }
        if (collection.assignmentDeadline <= new Date()) {
            throw new Error("The five-minute lab assignment window has expired");
        }
        const collector = await tx.collector.findUnique({ where: { collectorId } });
        if (!collector)
            throw new Error("Collector not found");
        if (collector.collectorType !== "LAB" || collector.labId !== lab.labId) {
            throw new Error("Selected collector does not belong to your lab");
        }
        if (collector.status !== "ACTIVE")
            throw new Error("Collector is inactive");
        if (collector.qualificationStatus !== "VERIFIED") {
            throw new Error("Collector qualification is not verified");
        }
        if (!collector.isAvailable)
            throw new Error("Collector is not currently available");
        const now = new Date();
        const existing = await tx.collectorAssignment.findUnique({
            where: { homeCollectionId },
        });
        if (existing && !["REJECTED", "CANCELLED"].includes(existing.status)) {
            throw new Error("A collector is already assigned to this booking");
        }
        const assignment = existing
            ? await tx.collectorAssignment.update({
                where: { collectorAssignmentId: existing.collectorAssignmentId },
                data: {
                    collectorId,
                    source: "LAB_INTERNAL",
                    status: "ASSIGNED",
                    assignedAt: now,
                    acceptedAt: null,
                },
                include: { collector: true, homeCollection: true },
            })
            : await tx.collectorAssignment.create({
                data: {
                    homeCollectionId,
                    collectorId,
                    source: "LAB_INTERNAL",
                    status: "ASSIGNED",
                    assignedAt: now,
                },
                include: { collector: true, homeCollection: true },
            });
        await tx.homeCollection.update({
            where: { homeCollectionId },
            data: { status: "ASSIGNED", allocationStage: "ASSIGNED", assignedAt: now },
        });
        await tx.homeCollectionTracking.create({
            data: {
                homeCollectionId,
                status: "ASSIGNED",
                notes: "Lab directly assigned its internal collector",
            },
        });
        await tx.collectorBookingOffer.updateMany({
            where: { homeCollectionId, status: "PENDING" },
            data: { status: "EXPIRED", respondedAt: now },
        });
        return assignment;
    }, { maxWait: 10000, timeout: 20000 });
}
// =========================================================
// HOME COLLECTION RETRIEVAL
// =========================================================
async function getHomeCollections() {
    return prisma_service_1.prisma.homeCollection.findMany({
        include: homeCollectionDetailsInclude,
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getHomeCollectionByAppointmentId(appointmentId) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    const homeCollection = await prisma_service_1.prisma.homeCollection.findUnique({
        where: { appointmentId },
        include: homeCollectionDetailsInclude,
    });
    if (!homeCollection) {
        throw new Error("Home collection not found");
    }
    return homeCollection;
}
async function getHomeCollectionById(homeCollectionId) {
    const homeCollection = await prisma_service_1.prisma.homeCollection.findUnique({
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
async function updateHomeCollection(homeCollectionId, data) {
    return prisma_service_1.prisma.$transaction(async (tx) => {
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
                throw new Error("Both latitude and longitude are required when updating location");
            }
            validateCoordinates(latitude, longitude);
        }
        if (data.status && data.status !== existing.status) {
            if (data.status === "COMPLETED") {
                throw new Error("Use the report/completion workflow to complete a home collection");
            }
            if (data.status === "ASSIGNED") {
                throw new Error("A collection can only become ASSIGNED through collector offer acceptance");
            }
            validateHomeCollectionTransition(existing.status, data.status);
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
        if (data.status &&
            data.status !== existing.status &&
            data.status !== "PENDING" &&
            data.status !== "CANCELLED") {
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
async function createCollector(data) {
    if (!data.userId?.trim()) {
        throw new Error("userId is required");
    }
    const collectorType = data.collectorType ?? "LAB";
    if (collectorType === "LAB") {
        if (!data.labId) {
            throw new Error("labId is required for a lab-affiliated collector");
        }
        const lab = await prisma_service_1.prisma.lab.findUnique({
            where: { labId: data.labId },
        });
        if (!lab) {
            throw new Error("Lab not found");
        }
    }
    if (collectorType === "INDEPENDENT" && data.labId) {
        throw new Error("Independent collectors must not be assigned to a lab");
    }
    const existingCollector = await prisma_service_1.prisma.collector.findUnique({
        where: { userId: data.userId },
    });
    if (existingCollector) {
        throw new apiError_1.apiError(409, "A collector profile already exists for this user");
    }
    return prisma_service_1.prisma.collector.create({
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
async function getCollectors() {
    return prisma_service_1.prisma.collector.findMany({
        include: {
            assignments: true,
            bookingOffers: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getCollectorsByLab(labId) {
    const lab = await prisma_service_1.prisma.lab.findUnique({
        where: { labId },
    });
    if (!lab) {
        throw new Error("Lab not found");
    }
    return prisma_service_1.prisma.collector.findMany({
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
async function getCollectorById(collectorId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
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
async function getMyCollectorProfile(userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
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
        throw new apiError_1.apiError(404, "Collector profile not found for the logged-in user");
    }
    return collector;
}
// =========================================================
// COLLECTOR LOCATION AND AVAILABILITY
// =========================================================
async function updateMyCollectorLocation(userId, latitude, longitude, isAvailable) {
    validateCoordinates(latitude, longitude);
    const collector = await prisma_service_1.prisma.collector.findUnique({
        where: { userId },
    });
    if (!collector) {
        throw new Error("Collector not found for this user");
    }
    if (collector.status !== "ACTIVE") {
        throw new Error("Collector account is inactive");
    }
    return prisma_service_1.prisma.collector.update({
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
async function getMyCollectorDashboard(userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
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
    const [assigned, accepted, completed, rejected, cancelled, pendingOffers, activeCollections, completedCollections,] = await Promise.all([
        prisma_service_1.prisma.collectorAssignment.count({
            where: { collectorId, status: "ASSIGNED" },
        }),
        prisma_service_1.prisma.collectorAssignment.count({
            where: { collectorId, status: "ACCEPTED" },
        }),
        prisma_service_1.prisma.collectorAssignment.count({
            where: { collectorId, status: "COMPLETED" },
        }),
        prisma_service_1.prisma.collectorAssignment.count({
            where: { collectorId, status: "REJECTED" },
        }),
        prisma_service_1.prisma.collectorAssignment.count({
            where: { collectorId, status: "CANCELLED" },
        }),
        collector.collectorType === "INDEPENDENT"
            ? prisma_service_1.prisma.collectorBookingOffer.count({
                where: {
                    collectorId,
                    status: "PENDING",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                    homeCollection: { allocationStage: "INDEPENDENT_POOL", status: "PENDING" },
                },
            })
            : Promise.resolve(0),
        prisma_service_1.prisma.collectorAssignment.count({
            where: {
                collectorId,
                status: { in: [...ACTIVE_ASSIGNMENT_STATUSES] },
                homeCollection: {
                    status: { in: [...ACTIVE_COLLECTION_STATUSES] },
                },
            },
        }),
        prisma_service_1.prisma.collectorAssignment.count({
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
            message: "Collector-specific earnings are not linked in the current schema.",
        },
    };
}
// =========================================================
// COLLECTOR HISTORY
// =========================================================
async function getMyCollectorHistory(userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
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
    const assignments = await prisma_service_1.prisma.collectorAssignment.findMany({
        where: {
            collectorId: collector.collectorId,
        },
        include: collectorBookingInclude,
        orderBy: {
            assignedAt: "desc",
        },
    });
    const offers = await prisma_service_1.prisma.collectorBookingOffer.findMany({
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
async function updateCollector(collectorId, data) {
    const existing = await prisma_service_1.prisma.collector.findUnique({
        where: { collectorId },
    });
    if (!existing) {
        throw new Error("Collector not found");
    }
    if (data.latitude !== undefined || data.longitude !== undefined) {
        const latitude = data.latitude ?? existing.latitude;
        const longitude = data.longitude ?? existing.longitude;
        if (latitude === null || longitude === null) {
            throw new Error("Both latitude and longitude are required when updating location");
        }
        validateCoordinates(latitude, longitude);
    }
    return prisma_service_1.prisma.collector.update({
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
async function deleteCollector(collectorId) {
    const existing = await prisma_service_1.prisma.collector.findUnique({
        where: { collectorId },
        include: {
            assignments: true,
            bookingOffers: true,
        },
    });
    if (!existing) {
        throw new Error("Collector not found");
    }
    if (existing.assignments.some((assignment) => assignment.status === "ASSIGNED" ||
        assignment.status === "ACCEPTED")) {
        throw new Error("Cannot delete a collector with active assignments");
    }
    if (existing.bookingOffers.some((offer) => offer.status === "PENDING")) {
        throw new Error("Cannot delete a collector with pending booking offers");
    }
    return prisma_service_1.prisma.collector.delete({
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
async function escalateDueHomeCollections() {
    const now = new Date();
    const firstReminderAt = new Date(now.getTime() - 2 * 60 * 1000);
    const finalReminderAt = new Date(now.getTime() - 4 * 60 * 1000);
    const reminderCandidates = await prisma_service_1.prisma.homeCollection.findMany({
        where: {
            status: "PENDING",
            allocationStage: "LAB_COLLECTORS",
            matchingStartedAt: { not: null },
            assignmentDeadline: { gt: now },
            collectorAssignment: { is: null },
            OR: [
                {
                    firstReminderSentAt: null,
                    matchingStartedAt: { lte: firstReminderAt },
                },
                {
                    finalReminderSentAt: null,
                    matchingStartedAt: { lte: finalReminderAt },
                },
            ],
        },
        select: { homeCollectionId: true },
    });
    const reminders = [];
    for (const item of reminderCandidates) {
        const reminder = await prisma_service_1.prisma.$transaction(async (tx) => {
            await lockHomeCollection(tx, item.homeCollectionId);
            const collection = await tx.homeCollection.findUnique({
                where: { homeCollectionId: item.homeCollectionId },
                include: {
                    appointment: { include: { lab: true } },
                    collectorAssignment: true,
                },
            });
            if (!collection ||
                collection.status !== "PENDING" ||
                collection.allocationStage !== "LAB_COLLECTORS" ||
                collection.collectorAssignment ||
                !collection.matchingStartedAt ||
                !collection.assignmentDeadline ||
                collection.assignmentDeadline <= new Date()) {
                return null;
            }
            const current = new Date();
            if (!collection.firstReminderSentAt &&
                collection.matchingStartedAt <=
                    new Date(current.getTime() - 2 * 60 * 1000)) {
                await tx.homeCollection.update({
                    where: { homeCollectionId: item.homeCollectionId },
                    data: { firstReminderSentAt: current },
                });
                return {
                    homeCollectionId: item.homeCollectionId,
                    labUserId: collection.appointment.lab?.labUserId ?? null,
                    reminderType: "FIRST",
                    assignmentDeadline: collection.assignmentDeadline,
                };
            }
            if (!collection.finalReminderSentAt &&
                collection.matchingStartedAt <=
                    new Date(current.getTime() - 4 * 60 * 1000)) {
                await tx.homeCollection.update({
                    where: { homeCollectionId: item.homeCollectionId },
                    data: { finalReminderSentAt: current },
                });
                return {
                    homeCollectionId: item.homeCollectionId,
                    labUserId: collection.appointment.lab?.labUserId ?? null,
                    reminderType: "FINAL",
                    assignmentDeadline: collection.assignmentDeadline,
                };
            }
            return null;
        }, { maxWait: 10000, timeout: 20000 });
        if (reminder)
            reminders.push(reminder);
    }
    // Only retry offers for bookings already pushed into the pool by the lab.
    const independentPoolCollections = await prisma_service_1.prisma.homeCollection.findMany({
        where: {
            status: "PENDING",
            allocationStage: "INDEPENDENT_POOL",
            collectorAssignment: { is: null },
        },
        select: { homeCollectionId: true },
        orderBy: { independentEscalatedAt: "asc" },
    });
    let retriedIndependentOffers = 0;
    for (const item of independentPoolCollections) {
        const count = await prisma_service_1.prisma.$transaction(async (tx) => {
            await lockHomeCollection(tx, item.homeCollectionId);
            const collection = await tx.homeCollection.findUnique({
                where: { homeCollectionId: item.homeCollectionId },
                include: { collectorAssignment: true },
            });
            if (!collection ||
                collection.status !== "PENDING" ||
                collection.allocationStage !== "INDEPENDENT_POOL" ||
                collection.collectorAssignment ||
                collection.latitude == null ||
                collection.longitude == null) {
                return 0;
            }
            return createIndependentCollectorOffers(tx, collection);
        }, { maxWait: 10000, timeout: 20000 });
        retriedIndependentOffers += count;
    }
    return {
        reminderEvents: reminders,
        remindersQueued: reminders.length,
        escalated: 0,
        retriedIndependentOffers,
        independentPoolChecked: independentPoolCollections.length,
    };
}
// =========================================================
// COLLECTOR BOOKING OFFERS
// =========================================================
async function getMyCollectorBookingOffers(userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
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
    if (collector.collectorType !== "INDEPENDENT" || collector.labId !== null) {
        return { collector, total: 0, offers: [] };
    }
    const offers = await prisma_service_1.prisma.collectorBookingOffer.findMany({
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
                    allocationStage: "INDEPENDENT_POOL",
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
async function acceptMyCollectorBookingOffer(offerId, userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
        where: { userId },
    });
    if (!collector) {
        throw new Error("Collector not found for this user");
    }
    if (collector.status !== "ACTIVE") {
        throw new Error("Collector account is inactive");
    }
    if (collector.collectorType !== "INDEPENDENT" ||
        collector.labId !== null) {
        throw new Error("Only independent collectors can accept booking offers");
    }
    if (collector.qualificationStatus !== "VERIFIED") {
        throw new Error("Collector qualification is not verified");
    }
    if (!collector.isAvailable) {
        throw new Error("Collector is not currently available");
    }
    const result = await prisma_service_1.prisma.$transaction(async (tx) => {
        const initialOffer = await tx.collectorBookingOffer.findUnique({
            where: { offerId },
        });
        if (!initialOffer) {
            throw new Error("Booking offer not found");
        }
        if (initialOffer.collectorId !== collector.collectorId) {
            throw new Error("This booking offer does not belong to this collector");
        }
        await lockHomeCollection(tx, initialOffer.homeCollectionId);
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
            return { expired: true };
        }
        const homeCollection = offer.homeCollection;
        if (homeCollection.status !== "PENDING" ||
            homeCollection.collectorAssignment) {
            throw new Error("Another collector has already accepted this booking");
        }
        if (homeCollection.allocationStage !== "INDEPENDENT_POOL") {
            throw new Error("This booking is not in the independent collector pool");
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
        if (currentCollector.status !== "ACTIVE" ||
            currentCollector.qualificationStatus !== "VERIFIED" ||
            !currentCollector.isAvailable) {
            throw new Error("Collector is no longer eligible to accept bookings");
        }
        if (!currentCollector.lastLocationAt ||
            currentCollector.lastLocationAt <
                getFreshLocationThreshold()) {
            throw new Error("Please update your current location before accepting bookings");
        }
        if (currentCollector.latitude === null ||
            currentCollector.longitude === null) {
            throw new Error("Collector location is unavailable");
        }
        if (homeCollection.latitude === null ||
            homeCollection.longitude === null) {
            throw new Error("Patient collection location is unavailable");
        }
        // Only independent collectors participate in the offer pool.
        if (currentCollector.collectorType !== "INDEPENDENT" ||
            currentCollector.labId !== null) {
            throw new Error("Only independent collectors can accept booking offers");
        }
        const distanceKm = calculateDistanceKm(homeCollection.latitude, homeCollection.longitude, currentCollector.latitude, currentCollector.longitude);
        if (distanceKm > INDEPENDENT_COLLECTOR_RADIUS_KM) {
            throw new Error("Patient location is outside the 25 km collection radius");
        }
        // The collector lock makes this count safe against concurrent accepts.
        const activeBookingCount = await tx.collectorAssignment.count({
            where: {
                collectorId: currentCollector.collectorId,
                status: {
                    in: [...ACTIVE_ASSIGNMENT_STATUSES],
                },
            },
        });
        if (activeBookingCount >= MAX_ACTIVE_BOOKINGS_PER_COLLECTOR) {
            throw new Error("You already have the maximum of five active bookings");
        }
        const assignment = await tx.collectorAssignment.create({
            data: {
                homeCollectionId: homeCollection.homeCollectionId,
                collectorId: currentCollector.collectorId,
                source: "INDEPENDENT_POOL",
                status: "ACCEPTED",
                acceptedAt: now,
                assignedAt: now,
            },
        });
        // Update parent HomeCollection.
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
        // Create tracking event.
        await tx.homeCollectionTracking.create({
            data: {
                homeCollectionId: homeCollection.homeCollectionId,
                status: "ASSIGNED",
                notes: "Collector accepted booking through INDEPENDENT_POOL",
            },
        });
        // Mark the accepted offer.
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
        // Fetch the assignment again so the response contains
        // the updated HomeCollection status and allocation stage.
        const updatedAssignment = await tx.collectorAssignment.findUnique({
            where: {
                collectorAssignmentId: assignment.collectorAssignmentId,
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
        if (!updatedAssignment) {
            throw new Error("Collector assignment could not be retrieved");
        }
        return {
            expired: false,
            assignment: updatedAssignment,
        };
    }, {
        maxWait: 10000,
        timeout: 20000,
    });
    if (result.expired) {
        throw new Error("This booking offer has expired");
    }
    return result.assignment;
}
// =========================================================
// REJECT BOOKING OFFER
// =========================================================
async function rejectMyCollectorBookingOffer(offerId, userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
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
    const collectorProfile = await prisma_service_1.prisma.collector.findUnique({ where: { userId }, select: { collectorType: true, labId: true } });
    if (!collectorProfile || collectorProfile.collectorType !== "INDEPENDENT" || collectorProfile.labId !== null) {
        throw new Error("Only independent collectors can reject booking offers");
    }
    return prisma_service_1.prisma.$transaction(async (tx) => {
        const offer = await tx.collectorBookingOffer.findUnique({
            where: { offerId },
        });
        if (!offer) {
            throw new Error("Booking offer not found");
        }
        if (offer.collectorId !== collector.collectorId) {
            throw new Error("This booking offer does not belong to this collector");
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
async function createCollectorAssignment(_data) {
    throw new Error("Direct collector assignment is disabled. Create booking offers and use the collector offer acceptance API.");
}
async function getCollectorAssignments() {
    return prisma_service_1.prisma.collectorAssignment.findMany({
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
async function getCollectorAssignmentById(collectorAssignmentId) {
    const assignment = await prisma_service_1.prisma.collectorAssignment.findUnique({
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
async function updateCollectorAssignment(collectorAssignmentId, data) {
    if (!data.status) {
        throw new Error("Assignment status is required");
    }
    if (data.status !== "COMPLETED") {
        throw new Error("Assignment acceptance and rejection must happen through the booking offer APIs. Only assignment completion is supported here.");
    }
    return prisma_service_1.prisma.$transaction(async (tx) => {
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
            throw new Error("Only an accepted assignment can be completed");
        }
        if (!["IN_LAB", "PROCESSING", "REPORT_READY", "COMPLETED"].includes(existing.homeCollection.status)) {
            throw new Error("A collector assignment can be completed only after the samples reach the lab");
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
async function deleteCollectorAssignment(collectorAssignmentId) {
    throw new Error("Collector assignments cannot be deleted directly. Use the appropriate cancellation workflow.");
}
// =========================================================
// HOME COLLECTION TRACKING
// =========================================================
async function createHomeCollectionTracking(data) {
    return prisma_service_1.prisma.$transaction(async (tx) => {
        const homeCollection = await tx.homeCollection.findUnique({
            where: {
                homeCollectionId: data.homeCollectionId,
            },
        });
        if (!homeCollection) {
            throw new Error("Home collection not found");
        }
        if (data.status === "ASSIGNED") {
            throw new Error("ASSIGNED tracking is created automatically when a collector accepts an offer");
        }
        const current = homeCollection.status;
        validateHomeCollectionTransition(current, data.status);
        if (current === data.status) {
            throw new Error(`Home collection is already in status ${data.status}`);
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
async function getHomeCollectionTracking(homeCollectionId) {
    const homeCollection = await prisma_service_1.prisma.homeCollection.findUnique({
        where: { homeCollectionId },
    });
    if (!homeCollection) {
        throw new Error("Home collection not found");
    }
    return prisma_service_1.prisma.homeCollectionTracking.findMany({
        where: { homeCollectionId },
        orderBy: {
            createdAt: "asc",
        },
    });
}
async function getHomeCollectionTrackingById(trackingId) {
    const tracking = await prisma_service_1.prisma.homeCollectionTracking.findUnique({
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
async function getCollectorBookings(collectorId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
        where: { collectorId },
    });
    if (!collector) {
        throw new Error("Collector not found");
    }
    return prisma_service_1.prisma.collectorAssignment.findMany({
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
async function getCollectorHistory(collectorId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
        where: { collectorId },
    });
    if (!collector) {
        throw new Error("Collector not found");
    }
    return prisma_service_1.prisma.collectorAssignment.findMany({
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
async function acceptCollectorAssignment(_collectorAssignmentId, _collectorId) {
    throw new Error("Direct assignment acceptance is disabled. Accept a booking offer instead.");
}
// =========================================================
// AUTHENTICATED COLLECTOR BOOKINGS
// =========================================================
async function getMyCollectorBookings(userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
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
        prisma_service_1.prisma.collectorAssignment.findMany({
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
        collector.collectorType === "INDEPENDENT" && collector.labId === null
            ? prisma_service_1.prisma.collectorBookingOffer.findMany({
                where: {
                    collectorId: collector.collectorId,
                    status: "PENDING",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                    homeCollection: {
                        is: {
                            status: "PENDING",
                            allocationStage: "INDEPENDENT_POOL",
                            collectorAssignment: { is: null },
                        },
                    },
                },
                include: {
                    homeCollection: {
                        include: { appointment: appointmentWithLabAndTestReports, samples: true },
                    },
                },
                orderBy: { offeredAt: "desc" },
            })
            : Promise.resolve([]),
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
async function acceptMyCollectorAssignment(_collectorAssignmentId, _userId) {
    throw new Error("Direct assignment acceptance is disabled. Use acceptMyCollectorBookingOffer instead.");
}
async function rejectMyCollectorAssignment(_collectorAssignmentId, _userId) {
    throw new Error("Direct assignment rejection is disabled. Use rejectMyCollectorBookingOffer instead.");
}
// =========================================================
// LAB HOME COLLECTION SUMMARY
// =========================================================
async function getHomeCollectionSummary(labUserId) {
    const lab = await prisma_service_1.prisma.lab.findFirst({
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
    ];
    const [total, grouped, allocationGrouped,] = await Promise.all([
        prisma_service_1.prisma.homeCollection.count({
            where: {
                appointment: {
                    labId: lab.labId,
                },
            },
        }),
        prisma_service_1.prisma.homeCollection.groupBy({
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
        prisma_service_1.prisma.homeCollection.groupBy({
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
    const counts = Object.fromEntries(statuses.map((status) => [status, 0]));
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
async function getHomeCollectionHistory(homeCollectionId, labUserId) {
    const lab = await prisma_service_1.prisma.lab.findFirst({
        where: { labUserId },
        select: { labId: true },
    });
    if (!lab) {
        throw new Error("Lab not found");
    }
    const collection = await prisma_service_1.prisma.homeCollection.findFirst({
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
/**
 * Lab explicitly pushes an unassigned home collection
 * into the independent collector pool.
 *
 * This is a manual action. The scheduler must never call this function.
 */
async function pushHomeCollectionToIndependentPool(homeCollectionId, labUserId) {
    return prisma_service_1.prisma.$transaction(async (tx) => {
        await lockHomeCollection(tx, homeCollectionId);
        const lab = await tx.lab.findFirst({
            where: { labUserId },
            select: { labId: true },
        });
        if (!lab) {
            throw new Error("Lab not found for the logged-in user");
        }
        const collection = await tx.homeCollection.findUnique({
            where: { homeCollectionId },
            include: {
                appointment: true,
                collectorAssignment: true,
            },
        });
        if (!collection) {
            throw new Error("Home collection not found");
        }
        if (collection.appointment.labId !== lab.labId) {
            throw new Error("This booking does not belong to your lab");
        }
        if (collection.status !== "PENDING") {
            throw new Error("Only pending bookings can be moved to the pool");
        }
        if (collection.allocationStage !== "LAB_COLLECTORS") {
            throw new Error("This booking is not awaiting lab allocation");
        }
        if (collection.collectorAssignment) {
            throw new Error("A collector is already assigned to this booking");
        }
        if (collection.latitude == null || collection.longitude == null) {
            throw new Error("Home collection location is missing");
        }
        const now = new Date();
        await tx.homeCollection.update({
            where: { homeCollectionId },
            data: {
                allocationStage: "INDEPENDENT_POOL",
                independentEscalatedAt: now,
            },
        });
        const offersCreated = await createIndependentCollectorOffers(tx, collection);
        const updated = await tx.homeCollection.findUnique({
            where: { homeCollectionId },
            include: homeCollectionDetailsInclude,
        });
        return {
            homeCollection: updated,
            allocationStage: "INDEPENDENT_POOL",
            offersCreated,
            pushedBy: "LAB",
        };
    }, { maxWait: 10000, timeout: 20000 });
}
// =========================================================
// PATIENT / CITIZEN HOME COLLECTION APIs
// =========================================================
/**
 * Get active home collection bookings for the logged-in patient.
 *
 * Ownership is verified using appointment.patientId.
 */
async function getMyHomeCollectionBookings(userId) {
    if (!userId?.trim()) {
        throw new Error("Authenticated user ID is required");
    }
    const bookings = await prisma_service_1.prisma.homeCollection.findMany({
        where: {
            appointment: {
                is: {
                    patientId: userId,
                },
            },
            status: {
                in: [...PATIENT_ACTIVE_HOME_COLLECTION_STATUSES],
            },
        },
        include: patientHomeCollectionInclude,
        orderBy: {
            createdAt: "desc",
        },
    });
    return {
        total: bookings.length,
        bookings,
    };
}
/**
 * Get completed and cancelled home collection bookings
 * for the logged-in patient.
 */
async function getMyHomeCollectionHistory(userId) {
    if (!userId?.trim()) {
        throw new Error("Authenticated user ID is required");
    }
    const bookings = await prisma_service_1.prisma.homeCollection.findMany({
        where: {
            appointment: {
                is: {
                    patientId: userId,
                },
            },
            status: {
                in: [...PATIENT_HOME_COLLECTION_HISTORY_STATUSES],
            },
        },
        include: patientHomeCollectionInclude,
        orderBy: {
            updatedAt: "desc",
        },
    });
    return {
        total: bookings.length,
        bookings,
    };
}
/**
 * Get one home collection booking belonging to the logged-in patient.
 *
 * A patient cannot access another patient's booking by changing
 * the homeCollectionId.
 */
async function getMyHomeCollectionById(homeCollectionId, userId) {
    if (!homeCollectionId?.trim()) {
        throw new Error("Home collection ID is required");
    }
    if (!userId?.trim()) {
        throw new Error("Authenticated user ID is required");
    }
    const booking = await prisma_service_1.prisma.homeCollection.findFirst({
        where: {
            homeCollectionId,
            appointment: {
                is: {
                    patientId: userId,
                },
            },
        },
        include: patientHomeCollectionInclude,
    });
    if (!booking) {
        throw new Error("Home collection booking not found");
    }
    return booking;
}
//# sourceMappingURL=homecollection.service.js.map