"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeAppointment = exports.createAppointment = void 0;
exports.getAppointments = getAppointments;
exports.getAppointmentsByLabId = getAppointmentsByLabId;
exports.getAppointmentsByPatient = getAppointmentsByPatient;
exports.getAppointmentById = getAppointmentById;
exports.updateAppointment = updateAppointment;
exports.deleteAppointment = deleteAppointment;
exports.createAppointmentTest = createAppointmentTest;
exports.getAllAppointmentTests = getAllAppointmentTests;
exports.getAppointmentTests = getAppointmentTests;
exports.getAppointmentTestById = getAppointmentTestById;
exports.updateAppointmentTest = updateAppointmentTest;
exports.deleteAppointmentTest = deleteAppointmentTest;
exports.createAppointmentService = createAppointmentService;
exports.getAllAppointmentServices = getAllAppointmentServices;
exports.getAppointmentServices = getAppointmentServices;
exports.getAppointmentServiceById = getAppointmentServiceById;
exports.updateAppointmentService = updateAppointmentService;
exports.deleteAppointmentService = deleteAppointmentService;
const crypto_1 = require("crypto");
const prisma_service_1 = require("./prisma.service");
// =========================================================
// CREATE APPOINTMENT
// =========================================================
const createAppointment = async (data) => {
    if (data.appointmentType === "LAB") {
        if (!data.labId) {
            throw new Error("Lab ID is required for LAB appointments");
        }
        if (data.scanCenterId) {
            throw new Error("Scan center ID is not allowed for LAB appointments");
        }
        if (!data.tests?.length) {
            throw new Error("At least one test is required for LAB appointments");
        }
        if (data.services?.length) {
            throw new Error("Services are not allowed for LAB appointments");
        }
        const lab = await prisma_service_1.prisma.lab.findFirst({
            where: {
                labId: data.labId,
                status: "ACTIVE",
            },
        });
        if (!lab) {
            throw new Error("Active lab not found");
        }
        const labTestIds = data.tests.map((test) => test.labTestId);
        if (new Set(labTestIds).size !== labTestIds.length) {
            throw new Error("Duplicate tests are not allowed");
        }
        const validTests = await prisma_service_1.prisma.labTest.findMany({
            where: {
                labId: data.labId,
                labTestId: { in: labTestIds },
                status: "ACTIVE",
            },
        });
        if (validTests.length !== labTestIds.length) {
            throw new Error("One or more tests are invalid or inactive for this lab");
        }
    }
    if (data.appointmentType === "SCAN") {
        if (!data.scanCenterId) {
            throw new Error("Scan center ID is required for SCAN appointments");
        }
        if (data.labId) {
            throw new Error("Lab ID is not allowed for SCAN appointments");
        }
        if (!data.services?.length) {
            throw new Error("At least one service is required for SCAN appointments");
        }
        if (data.tests?.length) {
            throw new Error("Tests are not allowed for SCAN appointments");
        }
        const scanCenter = await prisma_service_1.prisma.scanCenter.findFirst({
            where: {
                scanCenterId: data.scanCenterId,
                status: "ACTIVE",
            },
        });
        if (!scanCenter) {
            throw new Error("Active scan center not found");
        }
        const scanServiceIds = data.services.map((service) => service.scanServiceId);
        if (new Set(scanServiceIds).size !== scanServiceIds.length) {
            throw new Error("Duplicate services are not allowed");
        }
        const validServices = await prisma_service_1.prisma.scanService.findMany({
            where: {
                scanCenterId: data.scanCenterId,
                scanServiceId: { in: scanServiceIds },
                status: "ACTIVE",
            },
        });
        if (validServices.length !== scanServiceIds.length) {
            throw new Error("One or more services are invalid or inactive for this scan center");
        }
        if (data.appointmentMode === "HOME") {
            const unavailableHomeServices = validServices.filter((service) => !service.homeServiceAvailable);
            if (unavailableHomeServices.length) {
                throw new Error("One or more scan services are not available for home service");
            }
        }
        for (const service of data.services) {
            const scanService = validServices.find((item) => item.scanServiceId === service.scanServiceId);
            if (!scanService) {
                throw new Error("Invalid scan service");
            }
            if (scanService.equipmentRequired && !service.equipmentId) {
                throw new Error(`Equipment is required for scan service ${service.scanServiceId}`);
            }
            if (service.equipmentId) {
                const equipment = await prisma_service_1.prisma.equipment.findFirst({
                    where: {
                        equipmentId: service.equipmentId,
                        scanCenterId: data.scanCenterId,
                        status: "ACTIVE",
                    },
                });
                if (!equipment) {
                    throw new Error(`Invalid or inactive equipment: ${service.equipmentId}`);
                }
                const equipmentMapping = await prisma_service_1.prisma.equipmentService.findFirst({
                    where: {
                        equipmentId: service.equipmentId,
                        scanServiceId: service.scanServiceId,
                    },
                });
                if (!equipmentMapping) {
                    throw new Error("Selected equipment is not mapped to the scan service");
                }
            }
        }
    }
    if (data.appointmentMode === "HOME" && !data.address?.trim()) {
        throw new Error("Address is required for HOME appointments");
    }
    const bookingId = `BK-${(0, crypto_1.randomUUID)()}`;
    const createdAppointment = await prisma_service_1.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
            data: {
                bookingId,
                patientId: data.patientId,
                labId: data.labId,
                scanCenterId: data.scanCenterId,
                appointmentType: data.appointmentType,
                appointmentMode: data.appointmentMode,
                appointmentDate: new Date(data.appointmentDate),
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                address: data.address,
                status: data.status ?? "CONFIRMED",
                patientNotes: data.patientNotes,
            },
        });
        if (data.appointmentType === "LAB" && data.tests?.length) {
            const labTests = await tx.labTest.findMany({
                where: {
                    labId: data.labId,
                    labTestId: {
                        in: data.tests.map((test) => test.labTestId),
                    },
                    status: "ACTIVE",
                },
                include: {
                    testCatalog: true,
                },
            });
            await tx.appointmentTest.createMany({
                data: data.tests.map((test) => {
                    const labTest = labTests.find((item) => item.labTestId === test.labTestId);
                    if (!labTest) {
                        throw new Error(`Invalid lab test: ${test.labTestId}`);
                    }
                    return {
                        appointmentId: appointment.appointmentId,
                        labTestId: test.labTestId,
                        price: labTest.price,
                        fastingRequirement: labTest.testCatalog.fastingRequirement,
                        fastingHours: labTest.testCatalog.fastingHours,
                        preparationInstructions: labTest.testCatalog.preparationInstructions,
                    };
                }),
            });
        }
        if (data.appointmentType === "SCAN" && data.services?.length) {
            const scanServices = await tx.scanService.findMany({
                where: {
                    scanCenterId: data.scanCenterId,
                    scanServiceId: {
                        in: data.services.map((service) => service.scanServiceId),
                    },
                    status: "ACTIVE",
                },
            });
            await tx.appointmentService.createMany({
                data: data.services.map((service) => {
                    const scanService = scanServices.find((item) => item.scanServiceId === service.scanServiceId);
                    if (!scanService) {
                        throw new Error(`Invalid scan service: ${service.scanServiceId}`);
                    }
                    return {
                        appointmentId: appointment.appointmentId,
                        scanServiceId: service.scanServiceId,
                        equipmentId: service.equipmentId,
                        price: scanService.price,
                    };
                }),
            });
        }
        // Automatically create HomeCollection for LAB HOME appointments.
        if (data.appointmentType === "LAB" &&
            data.appointmentMode === "HOME") {
            await tx.homeCollection.create({
                data: {
                    appointmentId: appointment.appointmentId,
                    address: data.address.trim(),
                    latitude: data.latitude ?? null,
                    longitude: data.longitude ?? null,
                    specialInstructions: data.specialInstructions ?? null,
                    status: "PENDING",
                    allocationStage: "LAB_COLLECTORS",
                },
            });
        }
        return appointment;
    });
    return prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId: createdAppointment.appointmentId,
        },
        include: {
            lab: true,
            scanCenter: true,
            tests: {
                include: {
                    labTest: {
                        include: {
                            testCatalog: true,
                        },
                    },
                    samples: true,
                    report: {
                        include: {
                            files: true,
                        },
                    },
                },
            },
            services: {
                include: {
                    scanService: {
                        include: {
                            serviceCatalog: true,
                        },
                    },
                    equipment: true,
                },
            },
            homeCollection: true,
            cancellation: true,
            reschedules: true,
            reports: {
                include: {
                    files: true,
                },
            },
            earning: true,
        },
    });
};
exports.createAppointment = createAppointment;
// =========================================================
// GET ALL APPOINTMENTS
// =========================================================
async function getAppointments() {
    return prisma_service_1.prisma.appointment.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            //patient: true,
            lab: true,
            scanCenter: true,
            tests: {
                include: {
                    labTest: {
                        include: {
                            testCatalog: true,
                        },
                    },
                    report: {
                        include: { files: true },
                    },
                },
            },
            services: {
                include: {
                    scanService: {
                        include: {
                            serviceCatalog: true,
                        },
                    },
                    equipment: true,
                },
            },
            homeCollection: true,
            cancellation: true,
            reschedules: true,
            reports: {
                include: { files: true },
            },
            earning: true,
        },
    });
}
// =========================================================
// GET APPOINTMENTS BY LAB ID
// =========================================================
async function getAppointmentsByLabId(labId, userId) {
    // Verify that this lab belongs to the authenticated user.
    const lab = await prisma_service_1.prisma.lab.findFirst({
        where: {
            labId,
            labUserId: userId,
            status: "ACTIVE",
        },
        select: {
            labId: true,
        },
    });
    if (!lab) {
        throw new Error("Lab not found or access denied");
    }
    return prisma_service_1.prisma.appointment.findMany({
        where: {
            labId: lab.labId,
        },
        orderBy: {
            appointmentDate: "desc",
        },
        select: {
            appointmentId: true,
            bookingId: true,
            patientId: true,
            appointmentType: true,
            appointmentMode: true,
            appointmentDate: true,
            startTime: true,
            endTime: true,
            address: true,
            status: true,
            patientNotes: true,
            createdAt: true,
            updatedAt: true,
            lab: {
                select: {
                    labId: true,
                    name: true,
                    registrationNumber: true,
                    address: true,
                    districtId: true,
                    status: true,
                },
            },
            tests: {
                select: {
                    appointmentTestId: true,
                    labTestId: true,
                    price: true,
                    status: true,
                    fastingRequirement: true,
                    fastingHours: true,
                    preparationInstructions: true,
                    labTest: {
                        select: {
                            labTestId: true,
                            testCatalog: {
                                select: {
                                    testCatalogId: true,
                                    code: true,
                                    name: true,
                                    sampleType: true,
                                },
                            },
                        },
                    },
                    // Important: retrieve samples through AppointmentTest.
                    samples: {
                        select: {
                            sampleId: true,
                            barcode: true,
                            sampleType: true,
                            containerType: true,
                            status: true,
                            collectedAt: true,
                            receivedAt: true,
                            condition: true,
                            rejectionReason: true,
                            notes: true,
                            collector: {
                                select: {
                                    collectorId: true,
                                    name: true,
                                    role: true,
                                    collectorType: true,
                                },
                            },
                            trackingEvents: {
                                select: {
                                    sampleTrackingId: true,
                                    status: true,
                                    notes: true,
                                    createdAt: true,
                                },
                                orderBy: {
                                    createdAt: "desc",
                                },
                            },
                            evidence: {
                                select: {
                                    evidenceId: true,
                                    type: true,
                                    fileUrl: true,
                                    fileName: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                    report: {
                        select: {
                            reportId: true,
                            status: true,
                            uploadedAt: true,
                            sentAt: true,
                            files: {
                                select: {
                                    reportFileId: true,
                                    fileName: true,
                                    fileUrl: true,
                                    fileType: true,
                                    uploadedAt: true,
                                },
                            },
                        },
                    },
                },
            },
            homeCollection: {
                select: {
                    homeCollectionId: true,
                    address: true,
                    specialInstructions: true,
                    status: true,
                    assignedAt: true,
                    collectedAt: true,
                    completedAt: true,
                    collectorAssignment: {
                        select: {
                            collectorAssignmentId: true,
                            assignedAt: true,
                            status: true,
                            source: true,
                            collector: {
                                select: {
                                    collectorId: true,
                                    name: true,
                                    role: true,
                                    collectorType: true,
                                    qualificationStatus: true,
                                    status: true,
                                },
                            },
                        },
                    },
                    trackingEvents: {
                        select: {
                            trackingId: true,
                            status: true,
                            notes: true,
                            createdAt: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                    // Retain these because they are useful for collection-level tracking.
                    samples: {
                        select: {
                            sampleId: true,
                            barcode: true,
                            sampleType: true,
                            containerType: true,
                            status: true,
                            collectedAt: true,
                            receivedAt: true,
                            condition: true,
                            rejectionReason: true,
                            notes: true,
                            collector: {
                                select: {
                                    collectorId: true,
                                    name: true,
                                    role: true,
                                    collectorType: true,
                                },
                            },
                        },
                    },
                },
            },
            cancellation: {
                select: {
                    cancellationId: true,
                    reason: true,
                    additionalNotes: true,
                    cancelledAt: true,
                },
            },
            reschedules: {
                select: {
                    rescheduleId: true,
                    oldDate: true,
                    oldStartTime: true,
                    oldEndTime: true,
                    newDate: true,
                    newStartTime: true,
                    newEndTime: true,
                    reason: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            reports: {
                select: {
                    reportId: true,
                    appointmentTestId: true,
                    status: true,
                    uploadedAt: true,
                    sentAt: true,
                    files: {
                        select: {
                            reportFileId: true,
                            fileName: true,
                            fileUrl: true,
                            fileType: true,
                            uploadedAt: true,
                        },
                    },
                },
            },
            earning: {
                select: {
                    earningId: true,
                    amount: true,
                    status: true,
                    earnedAt: true,
                },
            },
        },
    });
}
const completeAppointment = async (appointmentId) => {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId },
        include: {
            tests: { include: { report: true } },
            services: true,
            reports: true,
        },
    });
    if (!appointment)
        throw new Error("Appointment not found");
    if (appointment.status === "COMPLETED") {
        throw new Error("Appointment is already completed");
    }
    if (appointment.status === "CANCELLED") {
        throw new Error("Cancelled appointment cannot be completed");
    }
    if (appointment.status === "RESCHEDULED") {
        throw new Error("Rescheduled appointment cannot be completed");
    }
    if (appointment.appointmentType === "LAB") {
        if (appointment.tests.length === 0) {
            throw new Error("At least one test is required to complete a LAB appointment");
        }
        if (appointment.tests.some((test) => test.status !== "COMPLETED")) {
            throw new Error("All appointment tests must be completed before completing the appointment");
        }
        const testsWithoutUploadedReports = appointment.tests.filter((test) => !test.report ||
            (test.report.status !== "UPLOADED" && test.report.status !== "SENT"));
        if (testsWithoutUploadedReports.length > 0) {
            throw new Error("Every lab test must have its own uploaded or sent report before completing the appointment");
        }
    }
    if (appointment.appointmentType === "SCAN") {
        if (appointment.services.length === 0) {
            throw new Error("At least one scan service is required to complete a SCAN appointment");
        }
        if (appointment.services.some((service) => service.status !== "COMPLETED")) {
            throw new Error("All appointment services must be completed before completing the appointment");
        }
        // SCAN reports remain appointment-level reports (appointmentTestId = null).
        const report = appointment.reports.find((item) => item.appointmentTestId === null);
        if (!report || (report.status !== "UPLOADED" && report.status !== "SENT")) {
            throw new Error("An uploaded or sent appointment-level report is required before completing the appointment");
        }
    }
    return prisma_service_1.prisma.appointment.update({
        where: { appointmentId },
        data: { status: "COMPLETED" },
        include: {
            lab: true,
            scanCenter: true,
            tests: {
                include: {
                    labTest: { include: { testCatalog: true } },
                    report: { include: { files: true } },
                },
            },
            services: {
                include: {
                    scanService: { include: { serviceCatalog: true } },
                    equipment: true,
                },
            },
            homeCollection: true,
            reports: { include: { files: true } },
            earning: true,
        },
    });
};
exports.completeAppointment = completeAppointment;
// =========================================================
// GET APPOINTMENTS BY PATIENT
// =========================================================
async function getAppointmentsByPatient(patientId) {
    // const patient = await prisma.appointment.findUnique({
    //   where: {
    //     patientId,
    //   },
    // });
    // if (!patient) {
    //   throw new Error("Patient not found");
    // }
    return prisma_service_1.prisma.appointment.findMany({
        where: {
            patientId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            lab: true,
            scanCenter: true,
            tests: {
                include: {
                    labTest: {
                        include: {
                            testCatalog: true,
                        },
                    },
                    report: {
                        include: { files: true },
                    },
                },
            },
            services: {
                include: {
                    scanService: {
                        include: {
                            serviceCatalog: true,
                        },
                    },
                    equipment: true,
                },
            },
            homeCollection: true,
            cancellation: true,
            reschedules: true,
            reports: {
                include: { files: true },
            },
            earning: true,
        },
    });
}
// =========================================================
// GET APPOINTMENT BY ID
// =========================================================
async function getAppointmentById(appointmentId) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId,
        },
        include: {
            // patient: true,
            lab: true,
            scanCenter: true,
            tests: {
                include: {
                    labTest: {
                        include: {
                            testCatalog: true,
                        },
                    },
                },
            },
            services: {
                include: {
                    scanService: {
                        include: {
                            serviceCatalog: true,
                        },
                    },
                    equipment: true,
                },
            },
            homeCollection: true,
            cancellation: true,
            reschedules: true,
            reports: {
                include: { files: true },
            },
            earning: true,
        },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    return appointment;
}
// =========================================================
// UPDATE APPOINTMENT
// =========================================================
async function updateAppointment(appointmentId, data) {
    const existing = await prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId,
        },
    });
    if (!existing) {
        throw new Error("Appointment not found");
    }
    return prisma_service_1.prisma.appointment.update({
        where: {
            appointmentId,
        },
        data: {
            appointmentDate: data.appointmentDate
                ? new Date(data.appointmentDate)
                : undefined,
            startTime: data.startTime
                ? new Date(data.startTime)
                : undefined,
            endTime: data.endTime
                ? new Date(data.endTime)
                : undefined,
            address: data.address,
            status: data.status,
            patientNotes: data.patientNotes,
        },
        include: {
            // patient: true,
            lab: true,
            scanCenter: true,
            tests: {
                include: {
                    labTest: {
                        include: {
                            testCatalog: true,
                        },
                    },
                    report: {
                        include: { files: true },
                    },
                },
            },
            services: {
                include: {
                    scanService: {
                        include: {
                            serviceCatalog: true,
                        },
                    },
                    equipment: true,
                },
            },
            homeCollection: true,
            reports: { include: { files: true } },
        },
    });
}
// =========================================================
// DELETE APPOINTMENT
// =========================================================
async function deleteAppointment(appointmentId) {
    const existing = await prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId,
        },
    });
    if (!existing) {
        throw new Error("Appointment not found");
    }
    await prisma_service_1.prisma.appointment.delete({
        where: {
            appointmentId,
        },
    });
    return true;
}
// =========================================================
// CREATE APPOINTMENT TEST
// =========================================================
// This is only for adding a test later to an existing
// appointment.
//
// Normal appointment creation already creates AppointmentTest
// automatically.
async function createAppointmentTest(data) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId: data.appointmentId,
        },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    if (appointment.appointmentType !== "LAB") {
        throw new Error("AppointmentTest can only be created for LAB appointment");
    }
    if (!appointment.labId) {
        throw new Error("Appointment labId not found");
    }
    const labTest = await prisma_service_1.prisma.labTest.findUnique({
        where: {
            labTestId: data.labTestId,
        },
        include: {
            testCatalog: true,
        },
    });
    if (!labTest) {
        throw new Error("Lab test not found");
    }
    if (labTest.labId !== appointment.labId) {
        throw new Error("Lab test does not belong to appointment lab");
    }
    if (labTest.status !== "ACTIVE") {
        throw new Error("Lab test is not active");
    }
    const existing = await prisma_service_1.prisma.appointmentTest.findUnique({
        where: {
            appointmentId_labTestId: {
                appointmentId: data.appointmentId,
                labTestId: data.labTestId,
            },
        },
    });
    if (existing) {
        throw new Error("This lab test is already added to the appointment");
    }
    return prisma_service_1.prisma.appointmentTest.create({
        data: {
            appointmentId: data.appointmentId,
            labTestId: data.labTestId,
            // Price automatically copied from LabTest
            price: labTest.price,
            status: data.status ?? "PENDING",
            fastingRequirement: labTest.testCatalog.fastingRequirement,
            fastingHours: labTest.testCatalog.fastingHours,
            preparationInstructions: labTest.testCatalog.preparationInstructions,
        },
        include: {
            labTest: {
                include: {
                    testCatalog: true,
                },
            },
            report: {
                include: { files: true },
            },
        },
    });
}
// =========================================================
// GET ALL APPOINTMENT TESTS
// =========================================================
async function getAllAppointmentTests() {
    return prisma_service_1.prisma.appointmentTest.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            appointment: true,
            labTest: {
                include: {
                    testCatalog: true,
                },
            },
            report: {
                include: { files: true },
            },
        },
    });
}
// =========================================================
// GET APPOINTMENT TESTS
// =========================================================
async function getAppointmentTests(appointmentId) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId,
        },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    return prisma_service_1.prisma.appointmentTest.findMany({
        where: {
            appointmentId,
        },
        orderBy: {
            createdAt: "asc",
        },
        include: {
            labTest: {
                include: {
                    testCatalog: true,
                },
            },
            report: {
                include: { files: true },
            },
        },
    });
}
// =========================================================
// GET APPOINTMENT TEST BY ID
// =========================================================
async function getAppointmentTestById(appointmentTestId) {
    const appointmentTest = await prisma_service_1.prisma.appointmentTest.findUnique({
        where: {
            appointmentTestId,
        },
        include: {
            appointment: true,
            labTest: {
                include: {
                    testCatalog: true,
                },
            },
            report: {
                include: { files: true },
            },
        },
    });
    if (!appointmentTest) {
        throw new Error("Appointment test not found");
    }
    return appointmentTest;
}
// =========================================================
// UPDATE APPOINTMENT TEST
// =========================================================
async function updateAppointmentTest(appointmentTestId, data) {
    const existing = await prisma_service_1.prisma.appointmentTest.findUnique({
        where: {
            appointmentTestId,
        },
    });
    if (!existing) {
        throw new Error("Appointment test not found");
    }
    return prisma_service_1.prisma.appointmentTest.update({
        where: {
            appointmentTestId,
        },
        data: {
            status: data.status,
        },
        include: {
            labTest: {
                include: {
                    testCatalog: true,
                },
            },
            report: {
                include: { files: true },
            },
        },
    });
}
// =========================================================
// DELETE APPOINTMENT TEST
// =========================================================
async function deleteAppointmentTest(appointmentTestId) {
    const existing = await prisma_service_1.prisma.appointmentTest.findUnique({
        where: {
            appointmentTestId,
        },
    });
    if (!existing) {
        throw new Error("Appointment test not found");
    }
    if (existing.status === "COMPLETED") {
        throw new Error("Cannot delete a completed appointment test");
    }
    const existingReport = await prisma_service_1.prisma.report.findUnique({
        where: { appointmentTestId },
    });
    if (existingReport) {
        throw new Error("Cannot delete an appointment test that already has a report");
    }
    await prisma_service_1.prisma.appointmentTest.delete({
        where: {
            appointmentTestId,
        },
    });
    return true;
}
// =========================================================
// CREATE APPOINTMENT SERVICE
// =========================================================
// Normally services are automatically created by
// createAppointment() for SCAN appointments.
//
// This API is only useful for adding a service later.
async function createAppointmentService(data) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId: data.appointmentId,
        },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    if (appointment.appointmentType !== "SCAN") {
        throw new Error("AppointmentService can only be created for SCAN appointment");
    }
    if (!appointment.scanCenterId) {
        throw new Error("Appointment scanCenterId not found");
    }
    const scanService = await prisma_service_1.prisma.scanService.findUnique({
        where: {
            scanServiceId: data.scanServiceId,
        },
        include: {
            serviceCatalog: true,
        },
    });
    if (!scanService) {
        throw new Error("Scan service not found");
    }
    if (scanService.scanCenterId !==
        appointment.scanCenterId) {
        throw new Error("Scan service does not belong to appointment scan center");
    }
    if (scanService.status !== "ACTIVE") {
        throw new Error("Scan service is not active");
    }
    // -------------------------------------------------------
    // HOME validation
    // -------------------------------------------------------
    if (appointment.appointmentMode === "HOME" &&
        !scanService.homeServiceAvailable) {
        throw new Error("Home service is not available for this scan service");
    }
    // -------------------------------------------------------
    // Equipment validation
    // -------------------------------------------------------
    if (scanService.equipmentRequired &&
        !data.equipmentId) {
        throw new Error("equipmentId is required for this scan service");
    }
    if (data.equipmentId) {
        const equipment = await prisma_service_1.prisma.equipment.findUnique({
            where: {
                equipmentId: data.equipmentId,
            },
        });
        if (!equipment) {
            throw new Error("Equipment not found");
        }
        if (equipment.scanCenterId !==
            appointment.scanCenterId) {
            throw new Error("Equipment does not belong to appointment scan center");
        }
        if (equipment.status !== "ACTIVE") {
            throw new Error("Equipment is not active");
        }
        const equipmentService = await prisma_service_1.prisma.equipmentService.findFirst({
            where: {
                equipmentId: data.equipmentId,
                scanServiceId: data.scanServiceId,
            },
        });
        if (!equipmentService) {
            throw new Error("Equipment is not mapped to this scan service");
        }
    }
    // -------------------------------------------------------
    // Prevent duplicate service
    // -------------------------------------------------------
    const existing = await prisma_service_1.prisma.appointmentService.findFirst({
        where: {
            appointmentId: data.appointmentId,
            scanServiceId: data.scanServiceId,
        },
    });
    if (existing) {
        throw new Error("This scan service is already added to the appointment");
    }
    return prisma_service_1.prisma.appointmentService.create({
        data: {
            appointmentId: data.appointmentId,
            scanServiceId: data.scanServiceId,
            equipmentId: data.equipmentId,
            // Price automatically copied from ScanService
            price: scanService.price,
            status: data.status ?? "PENDING",
        },
        include: {
            scanService: {
                include: {
                    serviceCatalog: true,
                },
            },
            equipment: true,
        },
    });
}
// =========================================================
// GET ALL APPOINTMENT SERVICES
// =========================================================
async function getAllAppointmentServices() {
    return prisma_service_1.prisma.appointmentService.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            appointment: true,
            scanService: {
                include: {
                    serviceCatalog: true,
                },
            },
            equipment: true,
        },
    });
}
// =========================================================
// GET APPOINTMENT SERVICES
// =========================================================
async function getAppointmentServices(appointmentId) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: {
            appointmentId,
        },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    return prisma_service_1.prisma.appointmentService.findMany({
        where: {
            appointmentId,
        },
        orderBy: {
            createdAt: "asc",
        },
        include: {
            scanService: {
                include: {
                    serviceCatalog: true,
                },
            },
            equipment: true,
        },
    });
}
// =========================================================
// GET APPOINTMENT SERVICE BY ID
// =========================================================
async function getAppointmentServiceById(appointmentServiceId) {
    const appointmentService = await prisma_service_1.prisma.appointmentService.findUnique({
        where: {
            appointmentServiceId,
        },
        include: {
            appointment: true,
            scanService: {
                include: {
                    serviceCatalog: true,
                },
            },
            equipment: true,
        },
    });
    if (!appointmentService) {
        throw new Error("Appointment service not found");
    }
    return appointmentService;
}
// =========================================================
// UPDATE APPOINTMENT SERVICE
// =========================================================
async function updateAppointmentService(appointmentServiceId, data) {
    const existing = await prisma_service_1.prisma.appointmentService.findUnique({
        where: {
            appointmentServiceId,
        },
    });
    if (!existing) {
        throw new Error("Appointment service not found");
    }
    if (data.equipmentId) {
        const appointment = await prisma_service_1.prisma.appointment.findUnique({
            where: {
                appointmentId: existing.appointmentId,
            },
        });
        if (!appointment) {
            throw new Error("Appointment not found");
        }
        if (!appointment.scanCenterId) {
            throw new Error("Appointment scanCenterId not found");
        }
        const equipment = await prisma_service_1.prisma.equipment.findUnique({
            where: {
                equipmentId: data.equipmentId,
            },
        });
        if (!equipment) {
            throw new Error("Equipment not found");
        }
        if (equipment.scanCenterId !==
            appointment.scanCenterId) {
            throw new Error("Equipment does not belong to appointment scan center");
        }
        if (equipment.status !== "ACTIVE") {
            throw new Error("Equipment is not active");
        }
        const equipmentService = await prisma_service_1.prisma.equipmentService.findFirst({
            where: {
                equipmentId: data.equipmentId,
                scanServiceId: existing.scanServiceId,
            },
        });
        if (!equipmentService) {
            throw new Error("Equipment is not mapped to this scan service");
        }
    }
    return prisma_service_1.prisma.appointmentService.update({
        where: {
            appointmentServiceId,
        },
        data: {
            equipmentId: data.equipmentId,
            status: data.status,
        },
        include: {
            scanService: {
                include: {
                    serviceCatalog: true,
                },
            },
            equipment: true,
        },
    });
}
// =========================================================
// DELETE APPOINTMENT SERVICE
// =========================================================
async function deleteAppointmentService(appointmentServiceId) {
    const existing = await prisma_service_1.prisma.appointmentService.findUnique({
        where: {
            appointmentServiceId,
        },
    });
    if (!existing) {
        throw new Error("Appointment service not found");
    }
    await prisma_service_1.prisma.appointmentService.delete({
        where: {
            appointmentServiceId,
        },
    });
    return true;
}
//# sourceMappingURL=appointment.service.js.map