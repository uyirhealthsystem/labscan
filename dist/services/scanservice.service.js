"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanService = createScanService;
exports.getScanServices = getScanServices;
exports.getScanServiceById = getScanServiceById;
exports.updateScanService = updateScanService;
exports.deleteScanService = deleteScanService;
const prisma_service_1 = require("./prisma.service");
const client_1 = require("../generated/prisma/client");
// =========================================================
// CREATE SCAN SERVICE
// =========================================================
async function createScanService(data) {
    // 1. Check whether scan center exists
    const scanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId: data.scanCenterId,
        },
    });
    if (!scanCenter) {
        throw new Error("Scan center not found");
    }
    // 2. Check whether catalog service exists
    const catalogService = await prisma_service_1.prisma.scanServiceCatalog.findUnique({
        where: {
            serviceCatalogId: data.serviceCatalogId,
        },
    });
    if (!catalogService) {
        throw new Error("Scan service catalog not found");
    }
    // 3. Check whether this service is already added
    const existingService = await prisma_service_1.prisma.scanService.findUnique({
        where: {
            scanCenterId_serviceCatalogId: {
                scanCenterId: data.scanCenterId,
                serviceCatalogId: data.serviceCatalogId,
            },
        },
    });
    if (existingService) {
        throw new Error("This service is already available in the scan center");
    }
    // 4. Validate price
    if (data.price !== undefined && data.price < 0) {
        throw new Error("Price cannot be negative");
    }
    // 5. Validate turnaround time
    if (data.turnaroundTime !== undefined &&
        data.turnaroundTime < 0) {
        throw new Error("Turnaround time cannot be negative");
    }
    // 6. Create scan service
    return prisma_service_1.prisma.scanService.create({
        data: {
            scanCenterId: data.scanCenterId,
            serviceCatalogId: data.serviceCatalogId,
            price: data.price,
            turnaroundTime: data.turnaroundTime,
            status: data.status ?? client_1.ScanServiceStatus.ACTIVE,
        },
        include: {
            serviceCatalog: true,
        },
    });
}
// =========================================================
// GET ALL SERVICES FOR A SCAN CENTER
// =========================================================
async function getScanServices(scanCenterId) {
    // Check scan center exists
    const scanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId,
        },
    });
    if (!scanCenter) {
        throw new Error("Scan center not found");
    }
    return prisma_service_1.prisma.scanService.findMany({
        where: {
            scanCenterId,
        },
        include: {
            scanCenter: {
                select: {
                    scanCenterId: true,
                    name: true,
                },
            },
            serviceCatalog: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
// =========================================================
// GET SINGLE SCAN SERVICE
// =========================================================
async function getScanServiceById(scanCenterId, scanServiceId) {
    const scanService = await prisma_service_1.prisma.scanService.findFirst({
        where: {
            scanServiceId,
            scanCenterId,
        },
        include: {
            serviceCatalog: true,
        },
    });
    if (!scanService) {
        throw new Error("Scan service not found");
    }
    return scanService;
}
// =========================================================
// UPDATE SCAN SERVICE
// =========================================================
async function updateScanService(scanCenterId, scanServiceId, data) {
    // Find service belonging to this scan center
    const existingService = await prisma_service_1.prisma.scanService.findFirst({
        where: {
            scanServiceId,
            scanCenterId,
        },
    });
    if (!existingService) {
        throw new Error("Scan service not found");
    }
    // Validate price
    if (data.price !== undefined && data.price < 0) {
        throw new Error("Price cannot be negative");
    }
    // Validate turnaround time
    if (data.turnaroundTime !== undefined &&
        data.turnaroundTime < 0) {
        throw new Error("Turnaround time cannot be negative");
    }
    return prisma_service_1.prisma.scanService.update({
        where: {
            scanServiceId,
        },
        data: {
            price: data.price,
            turnaroundTime: data.turnaroundTime,
            status: data.status,
        },
        include: {
            serviceCatalog: true,
        },
    });
}
// =========================================================
// DELETE SCAN SERVICE
// =========================================================
async function deleteScanService(scanCenterId, scanServiceId) {
    // Check service belongs to this scan center
    const existingService = await prisma_service_1.prisma.scanService.findFirst({
        where: {
            scanServiceId,
            scanCenterId,
        },
    });
    if (!existingService) {
        throw new Error("Scan service not found");
    }
    return prisma_service_1.prisma.scanService.delete({
        where: {
            scanServiceId,
        },
        include: {
            serviceCatalog: true,
        },
    });
}
//# sourceMappingURL=scanservice.service.js.map