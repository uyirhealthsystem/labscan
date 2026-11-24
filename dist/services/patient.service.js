"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientLabs = getPatientLabs;
exports.getPatientScanCenters = getPatientScanCenters;
exports.getPatientAppointments = getPatientAppointments;
exports.getPatientHomeCollections = getPatientHomeCollections;
exports.getPatientHomeCollection = getPatientHomeCollection;
exports.getPatientAppointment = getPatientAppointment;
exports.getPatientAppointmentReports = getPatientAppointmentReports;
exports.getPatientReportFile = getPatientReportFile;
exports.getPatientHomeCollectionTracking = getPatientHomeCollectionTracking;
const node_path_1 = __importDefault(require("node:path"));
const prisma_service_1 = require("./prisma.service");
const apiError_1 = require("../utils/apiError");
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
};
async function getPatientLabs() {
    return prisma_service_1.prisma.lab.findMany({
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
async function getPatientScanCenters() {
    return prisma_service_1.prisma.scanCenter.findMany({
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
function getPatientAppointments(patientId) {
    return prisma_service_1.prisma.appointment.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        include: patientAppointmentInclude,
    });
}
async function getPatientHomeCollections(patientId, history = false) {
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
async function getPatientHomeCollection(homeCollectionId, patientId) {
    const homeCollection = await prisma_service_1.prisma.homeCollection.findFirst({
        where: {
            homeCollectionId,
            appointment: { patientId },
        },
        select: { appointmentId: true },
    });
    if (!homeCollection) {
        throw new apiError_1.apiError(404, "Home collection not found");
    }
    return getPatientAppointment(homeCollection.appointmentId, patientId);
}
async function getPatientAppointment(appointmentId, patientId) {
    const appointment = await prisma_service_1.prisma.appointment.findFirst({
        where: { appointmentId, patientId },
        include: patientAppointmentInclude,
    });
    if (!appointment) {
        throw new apiError_1.apiError(404, "Appointment not found");
    }
    return appointment;
}
async function getPatientAppointmentReports(appointmentId, patientId) {
    const appointment = await prisma_service_1.prisma.appointment.findFirst({
        where: { appointmentId, patientId },
        select: { appointmentId: true },
    });
    if (!appointment) {
        throw new apiError_1.apiError(404, "Appointment not found");
    }
    const reports = await prisma_service_1.prisma.report.findMany({
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
async function getPatientReportFile(reportId, reportFileId, patientId) {
    const file = await prisma_service_1.prisma.reportFile.findFirst({
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
        throw new apiError_1.apiError(404, "Report file not found");
    }
    const filePath = node_path_1.default.resolve(process.cwd(), "uploads", "reports", node_path_1.default.basename(file.fileUrl));
    const reportsDirectory = node_path_1.default.resolve(process.cwd(), "uploads", "reports");
    if (!filePath.startsWith(`${reportsDirectory}${node_path_1.default.sep}`)) {
        throw new apiError_1.apiError(404, "Report file not found");
    }
    return { ...file, filePath };
}
async function getPatientHomeCollectionTracking(homeCollectionId, patientId) {
    const homeCollection = await prisma_service_1.prisma.homeCollection.findFirst({
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
        throw new apiError_1.apiError(404, "Home collection not found");
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
                location: collector.latitude !== null && collector.longitude !== null
                    ? { latitude: collector.latitude, longitude: collector.longitude, updatedAt: collector.lastLocationAt }
                    : null,
            }
            : null,
    };
}
//# sourceMappingURL=patient.service.js.map