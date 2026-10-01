import { prisma } from "./prisma.service";
import { ScanCenterStatus } from "../generated/prisma/client";

export interface CreateScanCenterInput {
  scanCenterUserId: string;
  name: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  districtId?: string;
  status?: ScanCenterStatus;
}

export interface UpdateScanCenterInput {
  name?: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  districtId?: string;
  status?: ScanCenterStatus;
}

// =========================================================
// CREATE SCAN CENTER
// =========================================================

export async function createScanCenter(
  data: CreateScanCenterInput,
) {
  if (data.registrationNumber) {
    const existingRegistration =
      await prisma.scanCenter.findFirst({
        where: {
          registrationNumber: data.registrationNumber,
        },
      });

    if (existingRegistration) {
      throw new Error("Registration number already exists");
    }
  }

  return prisma.scanCenter.create({
    data: {
      scanCenterUserId: data.scanCenterUserId,
      name: data.name,
      registrationNumber: data.registrationNumber,
      phone: data.phone,
      email: data.email,
      address: data.address,
      districtId: data.districtId,
      status:
        data.status ?? ScanCenterStatus.ACTIVE,
    },
  });
}

// =========================================================
// GET ALL SCAN CENTERS
// =========================================================

export async function getScanCenters() {
  return prisma.scanCenter.findMany({
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

export async function getScanCentersByDistrict(districtId: string) {
  return prisma.scanCenter.findMany({
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

export async function getScanCenterById(
  scanCenterId: string,
) {
  const scanCenter = await prisma.scanCenter.findUnique({
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

export async function updateScanCenter(
  scanCenterId: string,
  data: UpdateScanCenterInput,
) {
  const existingScanCenter =
    await prisma.scanCenter.findUnique({
      where: {
        scanCenterId,
        status: "ACTIVE",
      },
    });

  if (!existingScanCenter) {
    throw new Error("Scan center not found");
  }

  if (data.registrationNumber) {
    const existingRegistration =
      await prisma.scanCenter.findFirst({
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

  return prisma.scanCenter.update({
    where: {
      scanCenterId,
    },
    data,
  });
}

// =========================================================
// DELETE SCAN CENTER
// =========================================================

export async function deleteScanCenter(scanCenterId: string) {
  const existingScanCenter = await prisma.scanCenter.findUnique({
    where: {
      scanCenterId,
    },
  });

  if (!existingScanCenter) {
    throw new Error("Scan center not found");
  }

  return prisma.scanCenter.update({
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

export async function getScanCentersByUserId(userId: string) {
  return prisma.scanCenter.findMany({
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

export async function getScanCenterMetricsByDistrict(
  districtId: string,
) {
  const [totalScanCenters, activeScanCenters, inactiveScanCenters] =
    await Promise.all([
      prisma.scanCenter.count({
        where: {
          districtId,
        },
      }),

      prisma.scanCenter.count({
        where: {
          districtId,
          status: "ACTIVE",
        },
      }),

      prisma.scanCenter.count({
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
