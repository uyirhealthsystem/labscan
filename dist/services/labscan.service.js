"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabScanByUserId = getLabScanByUserId;
const prisma_service_1 = require("./prisma.service");
// =========================================================
// GET LAB + SCAN DATA BY USER ID
// =========================================================
async function getLabScanByUserId(userId) {
    const [labs, scanCenters] = await Promise.all([
        prisma_service_1.prisma.lab.findMany({
            where: {
                labUserId: userId,
                status: "ACTIVE",
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                tests: {
                    include: {
                        testCatalog: {
                            select: {
                                testCatalogId: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma_service_1.prisma.scanCenter.findMany({
            where: {
                scanCenterUserId: userId,
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
        }),
    ]);
    return {
        labs,
        scanCenters,
    };
}
//# sourceMappingURL=labscan.service.js.map