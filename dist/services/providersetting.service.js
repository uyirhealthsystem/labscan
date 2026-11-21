"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProviderSettings = exports.getProviderSettings = void 0;
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
const getProviderSettings = async (labId, scanCenterId) => {
    await validateProvider(labId, scanCenterId);
    const settings = await prisma_service_1.prisma.providerSettings.findFirst({
        where: labId
            ? { labId }
            : { scanCenterId },
    });
    // Create default settings if they don't exist
    if (!settings) {
        return prisma_service_1.prisma.providerSettings.create({
            data: {
                labId,
                scanCenterId,
            },
        });
    }
    return settings;
};
exports.getProviderSettings = getProviderSettings;
const updateProviderSettings = async (data) => {
    const { labId, scanCenterId } = data;
    await validateProvider(labId, scanCenterId);
    const existingSettings = await prisma_service_1.prisma.providerSettings.findFirst({
        where: labId
            ? { labId }
            : { scanCenterId },
    });
    if (!existingSettings) {
        return prisma_service_1.prisma.providerSettings.create({
            data: {
                labId,
                scanCenterId,
                notificationsEnabled: data.notificationsEnabled ?? true,
                bookingNotifications: data.bookingNotifications ?? true,
                reportNotifications: data.reportNotifications ?? true,
                payoutNotifications: data.payoutNotifications ?? true,
                emailNotifications: data.emailNotifications ?? true,
                smsNotifications: data.smsNotifications ?? true,
            },
        });
    }
    return prisma_service_1.prisma.providerSettings.update({
        where: {
            settingsId: existingSettings.settingsId,
        },
        data: {
            ...(data.notificationsEnabled !== undefined && {
                notificationsEnabled: data.notificationsEnabled,
            }),
            ...(data.bookingNotifications !== undefined && {
                bookingNotifications: data.bookingNotifications,
            }),
            ...(data.reportNotifications !== undefined && {
                reportNotifications: data.reportNotifications,
            }),
            ...(data.payoutNotifications !== undefined && {
                payoutNotifications: data.payoutNotifications,
            }),
            ...(data.emailNotifications !== undefined && {
                emailNotifications: data.emailNotifications,
            }),
            ...(data.smsNotifications !== undefined && {
                smsNotifications: data.smsNotifications,
            }),
        },
    });
};
exports.updateProviderSettings = updateProviderSettings;
//# sourceMappingURL=providersetting.service.js.map