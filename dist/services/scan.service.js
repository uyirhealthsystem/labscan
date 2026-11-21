"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanCenter = createScanCenter;
exports.getScanCenters = getScanCenters;
exports.getScanCentersByDistrict = getScanCentersByDistrict;
exports.getScanCenterById = getScanCenterById;
exports.updateScanCenter = updateScanCenter;
exports.deleteScanCenter = deleteScanCenter;
exports.getScanCentersByUserId = getScanCentersByUserId;
exports.getScanCenterMetricsByDistrict = getScanCenterMetricsByDistrict;
const prisma_service_1 = require("./prisma.service");
const client_1 = require("../generated/prisma/client");
// =========================================================
// CREATE SCAN CENTER
// =========================================================
async function createScanCenter(data) {
    if (data.registrationNumber) {
        const existingRegistration = await prisma_service_1.prisma.scanCenter.findFirst({
            where: {
                registrationNumber: data.registrationNumber,
            },
        });
        if (existingRegistration) {
            throw new Error("Registration number already exists");
        }
    }
    return prisma_service_1.prisma.scanCenter.create({
        data: {
            scanCenterUserId: data.scanCenterUserId,
            name: data.name,
            registrationNumber: data.registrationNumber,
            phone: data.phone,
            email: data.email,
            address: data.address,
            districtId: data.districtId,
            status: data.status ?? client_1.ScanCenterStatus.ACTIVE,
        },
    });
}
// =========================================================
// GET ALL SCAN CENTERS
// =========================================================
async function getScanCenters() {
    return prisma_service_1.prisma.scanCenter.findMany({
        orderBy: {
            createdAt: "desc",
        },
        where: {
            status: "ACTIVE",
        },
        include: {
            services: {
                include: {
                    serviceCatalog: {
                        select: {
                            serviceCatalogId: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
}
// =========================================================
// GET SCAN CENTERS BY DISTRICT
// =========================================================
async function getScanCentersByDistrict(districtId) {
    return prisma_service_1.prisma.scanCenter.findMany({
        where: {
            districtId,
            status: "ACTIVE",
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
// =========================================================
// GET SCAN CENTER BY ID
// =========================================================
async function getScanCenterById(scanCenterId) {
    const scanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId,
            status: "ACTIVE",
        },
        include: {
            services: true,
        },
    });
    if (!scanCenter) {
        throw new Error("Scan center not found");
    }
    return scanCenter;
}
// =========================================================
// UPDATE SCAN CENTER
// =========================================================
async function updateScanCenter(scanCenterId, data) {
    const existingScanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId,
            status: "ACTIVE",
        },
    });
    if (!existingScanCenter) {
        throw new Error("Scan center not found");
    }
    if (data.registrationNumber) {
        const existingRegistration = await prisma_service_1.prisma.scanCenter.findFirst({
            where: {
                registrationNumber: data.registrationNumber,
                NOT: {
                    scanCenterId,
                },
            },
        });
        if (existingRegistration) {
            throw new Error("Registration number already exists");
        }
    }
    return prisma_service_1.prisma.scanCenter.update({
        where: {
            scanCenterId,
        },
        data,
    });
}
// =========================================================
// DELETE SCAN CENTER
// =========================================================
async function deleteScanCenter(scanCenterId) {
    const existingScanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId,
        },
    });
    if (!existingScanCenter) {
        throw new Error("Scan center not found");
    }
    return prisma_service_1.prisma.scanCenter.update({
        where: {
            scanCenterId,
        },
        data: {
            status: "INACTIVE",
        },
    });
}
// =========================================================
// GET SCAN CENTERS BY USER ID
// =========================================================
async function getScanCentersByUserId(userId) {
    return prisma_service_1.prisma.scanCenter.findMany({
        where: {
            scanCenterUserId: userId,
            status: "ACTIVE",
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            services: {
                include: {
                    serviceCatalog: {
                        select: {
                            serviceCatalogId: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
}
async function getScanCenterMetricsByDistrict(districtId) {
    const [totalScanCenters, activeScanCenters, inactiveScanCenters] = await Promise.all([
        prisma_service_1.prisma.scanCenter.count({
            where: {
                districtId,
            },
        }),
        prisma_service_1.prisma.scanCenter.count({
            where: {
                districtId,
                status: "ACTIVE",
            },
        }),
        prisma_service_1.prisma.scanCenter.count({
            where: {
                districtId,
                status: "INACTIVE",
            },
        }),
    ]);
    return {
        totalScanCenters,
        activeScanCenters,
        inactiveScanCenters,
    };
}
//# sourceMappingURL=scan.service.js.map