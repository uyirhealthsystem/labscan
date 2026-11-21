"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLab = createLab;
exports.getLabs = getLabs;
exports.getLabsByDistrict = getLabsByDistrict;
exports.getLabById = getLabById;
exports.updateLab = updateLab;
exports.deleteLab = deleteLab;
exports.getLabsByUserId = getLabsByUserId;
exports.getLabMetricsByDistrict = getLabMetricsByDistrict;
const prisma_service_1 = require("./prisma.service");
const client_1 = require("../generated/prisma/client");
// =========================================================
// CREATE LAB
// =========================================================
async function createLab(data) {
    if (data.registrationNumber) {
        const existingRegistration = await prisma_service_1.prisma.lab.findFirst({
            where: {
                registrationNumber: data.registrationNumber,
            },
        });
        if (existingRegistration) {
            throw new Error("Registration number already exists");
        }
    }
    return prisma_service_1.prisma.lab.create({
        data: {
            labUserId: data.labUserId,
            name: data.name,
            registrationNumber: data.registrationNumber,
            phone: data.phone,
            email: data.email,
            address: data.address,
            districtId: data.districtId,
            status: data.status ?? client_1.LabStatus.ACTIVE,
        },
    });
}
// =========================================================
// GET ALL LABS
// =========================================================
async function getLabs() {
    return prisma_service_1.prisma.lab.findMany({
        orderBy: {
            createdAt: "desc",
        },
        where: {
            status: "ACTIVE",
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
    });
}
// =========================================================
// GET LABS BY DISTRICT
// =========================================================
async function getLabsByDistrict(districtId) {
    return prisma_service_1.prisma.lab.findMany({
        where: {
            districtId,
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
    });
}
// =========================================================
// GET LAB BY ID
// =========================================================
async function getLabById(labId) {
    const lab = await prisma_service_1.prisma.lab.findUnique({
        where: {
            labId,
            status: "ACTIVE",
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
    });
    if (!lab) {
        throw new Error("Lab not found");
    }
    return lab;
}
// =========================================================
// UPDATE LAB
// =========================================================
async function updateLab(labId, data) {
    const existingLab = await prisma_service_1.prisma.lab.findUnique({
        where: {
            labId,
            status: "ACTIVE",
        },
    });
    if (!existingLab) {
        throw new Error("Lab not found");
    }
    if (data.registrationNumber) {
        const existingRegistration = await prisma_service_1.prisma.lab.findFirst({
            where: {
                registrationNumber: data.registrationNumber,
                NOT: {
                    labId,
                },
            },
        });
        if (existingRegistration) {
            throw new Error("Registration number already exists");
        }
    }
    return prisma_service_1.prisma.lab.update({
        where: {
            labId,
        },
        data,
    });
}
// =========================================================
// DELETE LAB
// =========================================================
async function deleteLab(labId) {
    const existingLab = await prisma_service_1.prisma.lab.findUnique({
        where: {
            labId,
        },
    });
    if (!existingLab) {
        throw new Error("Lab not found");
    }
    return prisma_service_1.prisma.lab.update({
        where: {
            labId,
        },
        data: {
            status: client_1.LabStatus.INACTIVE,
        },
    });
}
// =========================================================
// GET LABS BY USER ID
// =========================================================
async function getLabsByUserId(userId) {
    return prisma_service_1.prisma.lab.findMany({
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
    });
}
async function getLabMetricsByDistrict(districtId) {
    const [totalLabs, activeLabs, inactiveLabs] = await Promise.all([
        prisma_service_1.prisma.lab.count({
            where: {
                districtId,
            },
        }),
        prisma_service_1.prisma.lab.count({
            where: {
                districtId,
                status: "ACTIVE",
            },
        }),
        prisma_service_1.prisma.lab.count({
            where: {
                districtId,
                status: "INACTIVE",
            },
        }),
    ]);
    return {
        totalLabs,
        activeLabs,
        inactiveLabs,
    };
}
//# sourceMappingURL=lab.service.js.map