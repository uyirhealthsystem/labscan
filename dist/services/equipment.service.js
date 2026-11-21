"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEquipment = createEquipment;
exports.getEquipments = getEquipments;
exports.getEquipmentsByScanCenter = getEquipmentsByScanCenter;
exports.getEquipmentById = getEquipmentById;
exports.updateEquipment = updateEquipment;
exports.deleteEquipment = deleteEquipment;
exports.createEquipmentService = createEquipmentService;
exports.getEquipmentServices = getEquipmentServices;
exports.getEquipmentServicesByEquipment = getEquipmentServicesByEquipment;
exports.getEquipmentServicesByScanService = getEquipmentServicesByScanService;
exports.getEquipmentServiceById = getEquipmentServiceById;
exports.deleteEquipmentService = deleteEquipmentService;
const prisma_service_1 = require("./prisma.service");
async function createEquipment(data) {
    const scanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId: data.scanCenterId,
        },
    });
    if (!scanCenter) {
        throw new Error("Scan center not found");
    }
    return prisma_service_1.prisma.equipment.create({
        data: {
            scanCenterId: data.scanCenterId,
            name: data.name,
            equipmentType: data.equipmentType,
            manufacturer: data.manufacturer,
            modelNumber: data.modelNumber,
            status: data.status,
        },
    });
}
async function getEquipments() {
    return prisma_service_1.prisma.equipment.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getEquipmentsByScanCenter(scanCenterId) {
    const scanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId,
        },
    });
    if (!scanCenter) {
        throw new Error("Scan center not found");
    }
    return prisma_service_1.prisma.equipment.findMany({
        where: {
            scanCenterId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getEquipmentById(equipmentId) {
    const equipment = await prisma_service_1.prisma.equipment.findUnique({
        where: {
            equipmentId,
        },
        include: {
            scanCenter: true,
            services: {
                include: {
                    scanService: true,
                },
            },
        },
    });
    if (!equipment) {
        throw new Error("Equipment not found");
    }
    return equipment;
}
async function updateEquipment(equipmentId, data) {
    const existingEquipment = await prisma_service_1.prisma.equipment.findUnique({
        where: {
            equipmentId,
        },
    });
    if (!existingEquipment) {
        throw new Error("Equipment not found");
    }
    return prisma_service_1.prisma.equipment.update({
        where: {
            equipmentId,
        },
        data,
    });
}
async function deleteEquipment(equipmentId) {
    const existingEquipment = await prisma_service_1.prisma.equipment.findUnique({
        where: {
            equipmentId,
        },
    });
    if (!existingEquipment) {
        throw new Error("Equipment not found");
    }
    return prisma_service_1.prisma.equipment.delete({
        where: {
            equipmentId,
        },
    });
}
async function createEquipmentService(data) {
    const equipment = await prisma_service_1.prisma.equipment.findUnique({
        where: {
            equipmentId: data.equipmentId,
        },
    });
    if (!equipment) {
        throw new Error("Equipment not found");
    }
    const scanService = await prisma_service_1.prisma.scanService.findUnique({
        where: {
            scanServiceId: data.scanServiceId,
        },
    });
    if (!scanService) {
        throw new Error("Scan service not found");
    }
    // Equipment and scan service must belong to the same scan center
    if (equipment.scanCenterId !== scanService.scanCenterId) {
        throw new Error("Equipment and scan service must belong to the same scan center");
    }
    const existing = await prisma_service_1.prisma.equipmentService.findUnique({
        where: {
            equipmentId_scanServiceId: {
                equipmentId: data.equipmentId,
                scanServiceId: data.scanServiceId,
            },
        },
    });
    if (existing) {
        throw new Error("This equipment is already mapped to this scan service");
    }
    return prisma_service_1.prisma.equipmentService.create({
        data: {
            equipmentId: data.equipmentId,
            scanServiceId: data.scanServiceId,
        },
        include: {
            equipment: true,
            scanService: true,
        },
    });
}
async function getEquipmentServices() {
    return prisma_service_1.prisma.equipmentService.findMany({
        include: {
            equipment: true,
            scanService: {
                include: {
                    serviceCatalog: {
                        select: {
                            serviceCatalogId: true,
                            code: true,
                            name: true
                        }
                    },
                    scanCenter: {
                        select: {
                            scanCenterId: true,
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getEquipmentServicesByEquipment(equipmentId) {
    const equipment = await prisma_service_1.prisma.equipment.findUnique({
        where: {
            equipmentId,
        },
    });
    if (!equipment) {
        throw new Error("Equipment not found");
    }
    return prisma_service_1.prisma.equipmentService.findMany({
        where: {
            equipmentId,
        },
        include: {
            scanService: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getEquipmentServicesByScanService(scanServiceId) {
    const scanService = await prisma_service_1.prisma.scanService.findUnique({
        where: {
            scanServiceId,
        },
    });
    if (!scanService) {
        throw new Error("Scan service not found");
    }
    return prisma_service_1.prisma.equipmentService.findMany({
        where: {
            scanServiceId,
        },
        include: {
            equipment: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getEquipmentServiceById(equipmentServiceId) {
    const equipmentService = await prisma_service_1.prisma.equipmentService.findUnique({
        where: {
            equipmentServiceId,
        },
        include: {
            equipment: true,
            scanService: true,
        },
    });
    if (!equipmentService) {
        throw new Error("Equipment service mapping not found");
    }
    return equipmentService;
}
async function deleteEquipmentService(equipmentServiceId) {
    const existing = await prisma_service_1.prisma.equipmentService.findUnique({
        where: {
            equipmentServiceId,
        },
    });
    if (!existing) {
        throw new Error("Equipment service mapping not found");
    }
    return prisma_service_1.prisma.equipmentService.delete({
        where: {
            equipmentServiceId,
        },
    });
}
//# sourceMappingURL=equipment.service.js.map