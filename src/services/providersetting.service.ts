import { prisma } from "./prisma.service";

export interface ProviderSettingsInput {
  labId?: string;
  scanCenterId?: string;
  notificationsEnabled?: boolean;
  bookingNotifications?: boolean;
  reportNotifications?: boolean;
  payoutNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

const validateProvider = async (
  labId?: string,
  scanCenterId?: string,
) => {
  if (!labId && !scanCenterId) {
    throw new Error("Either labId or scanCenterId is required");
  }

  if (labId && scanCenterId) {
    throw new Error("Provide either labId or scanCenterId, not both");
  }

  if (labId) {
    const lab = await prisma.lab.findUnique({
      where: {
        labId,
      },
    });

    if (!lab) {
      throw new Error("Lab not found");
    }

    return;
  }

  const scanCenter = await prisma.scanCenter.findUnique({
    where: {
      scanCenterId: scanCenterId!,
    },
  });

  if (!scanCenter) {
    throw new Error("Scan center not found");
  }
};

export const getProviderSettings = async (
  labId?: string,
  scanCenterId?: string,
) => {
  await validateProvider(labId, scanCenterId);

  const settings = await prisma.providerSettings.findFirst({
    where: labId
      ? { labId }
      : { scanCenterId },
  });

  // Create default settings if they don't exist
  if (!settings) {
    return prisma.providerSettings.create({
      data: {
        labId,
        scanCenterId,
      },
    });
  }

  return settings;
};

export const updateProviderSettings = async (
  data: ProviderSettingsInput,
) => {
  const { labId, scanCenterId } = data;

  await validateProvider(labId, scanCenterId);

  const existingSettings = await prisma.providerSettings.findFirst({
    where: labId
      ? { labId }
      : { scanCenterId },
  });

  if (!existingSettings) {
    return prisma.providerSettings.create({
      data: {
        labId,
        scanCenterId,
        notificationsEnabled:
          data.notificationsEnabled ?? true,
        bookingNotifications:
          data.bookingNotifications ?? true,
        reportNotifications:
          data.reportNotifications ?? true,
        payoutNotifications:
          data.payoutNotifications ?? true,
        emailNotifications:
          data.emailNotifications ?? true,
        smsNotifications:
          data.smsNotifications ?? true,
      },
    });
  }

  return prisma.providerSettings.update({
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