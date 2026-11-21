"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportTickets = exports.createSupportTicket = void 0;
const prisma_service_1 = require("./prisma.service");
const validateProvider = async (labId, scanCenterId) => {
    if (!labId && !scanCenterId) {
        throw new Error("Either labId or scanCenterId is required");
    }
    if (labId && scanCenterId) {
        throw new Error("Provide either labId or scanCenterId, not both");
    }
    if (labId) {
        const lab = await prisma_service_1.prisma.lab.findUnique({
            where: {
                labId,
            },
        });
        if (!lab) {
            throw new Error("Lab not found");
        }
        return;
    }
    const scanCenter = await prisma_service_1.prisma.scanCenter.findUnique({
        where: {
            scanCenterId: scanCenterId,
        },
    });
    if (!scanCenter) {
        throw new Error("Scan center not found");
    }
};
const createSupportTicket = async (data) => {
    await validateProvider(data.labId, data.scanCenterId);
    if (!data.subject?.trim()) {
        throw new Error("Subject is required");
    }
    if (!data.description?.trim()) {
        throw new Error("Description is required");
    }
    return prisma_service_1.prisma.supportTicket.create({
        data: {
            labId: data.labId,
            scanCenterId: data.scanCenterId,
            subject: data.subject.trim(),
            description: data.description.trim(),
            category: data.category ?? "OTHER",
            priority: data.priority ?? "MEDIUM",
        },
    });
};
exports.createSupportTicket = createSupportTicket;
const getSupportTickets = async (labId, scanCenterId) => {
    await validateProvider(labId, scanCenterId);
    return prisma_service_1.prisma.supportTicket.findMany({
        where: labId
            ? { labId }
            : { scanCenterId },
        orderBy: {
            createdAt: "desc",
        },
    });
};
exports.getSupportTickets = getSupportTickets;
//# sourceMappingURL=support.service.js.map