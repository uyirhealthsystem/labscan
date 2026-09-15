import { prisma } from "./prisma.service";
import { ScanServiceStatus } from "../generated/prisma/client";

export interface CreateScanServiceInput {
  scanCenterId: string;
  serviceCatalogId: string;
  price?: number;
  turnaroundTime?: number;
  status?: ScanServiceStatus;
}

export interface UpdateScanServiceInput {
  price?: number;
  turnaroundTime?: number;
  status?: ScanServiceStatus;
}


// =========================================================
// CREATE SCAN SERVICE
// =========================================================

export async function createScanService(
  data: CreateScanServiceInput,
) {
  // 1. Check whether scan center exists
  const scanCenter = await prisma.scanCenter.findUnique({
    where: {
      scanCenterId: data.scanCenterId,
    },
  });

  if (!scanCenter) {
    throw new Error("Scan center not found");
  }

  // 2. Check whether catalog service exists
  const catalogService =
    await prisma.scanServiceCatalog.findUnique({
      where: {
        serviceCatalogId: data.serviceCatalogId,
      },
    });

  if (!catalogService) {
    throw new Error("Scan service catalog not found");
  }

  // 3. Check whether this service is already added
  const existingService =
    await prisma.scanService.findUnique({
      where: {
        scanCenterId_serviceCatalogId: {
          scanCenterId: data.scanCenterId,
          serviceCatalogId: data.serviceCatalogId,
        },
      },
    });

  if (existingService) {
    throw new Error(
      "This service is already available in the scan center",
    );
  }

  // 4. Validate price
  if (data.price !== undefined && data.price < 0) {
    throw new Error("Price cannot be negative");
  }

  // 5. Validate turnaround time
  if (
    data.turnaroundTime !== undefined &&
    data.turnaroundTime < 0
  ) {
    throw new Error("Turnaround time cannot be negative");
  }

  // 6. Create scan service
  return prisma.scanService.create({
    data: {
      scanCenterId: data.scanCenterId,
      serviceCatalogId: data.serviceCatalogId,
      price: data.price,
      turnaroundTime: data.turnaroundTime,
      status: data.status ?? ScanServiceStatus.ACTIVE,
    },
    include: {
      serviceCatalog: true,
    },
  });
}


// =========================================================
// GET ALL SERVICES FOR A SCAN CENTER
// =========================================================

export async function getScanServices(
  scanCenterId: string,
) {
  // Check scan center exists
  const scanCenter = await prisma.scanCenter.findUnique({
    where: {
      scanCenterId,
    },
  });

  if (!scanCenter) {
    throw new Error("Scan center not found");
  }
return prisma.scanService.findMany({
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

export async function getScanServiceById(
  scanCenterId: string,
  scanServiceId: string,
) {
  const scanService = await prisma.scanService.findFirst({
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

export async function updateScanService(
  scanCenterId: string,
  scanServiceId: string,
  data: UpdateScanServiceInput,
) {
  // Find service belonging to this scan center
  const existingService =
    await prisma.scanService.findFirst({
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
  if (
    data.turnaroundTime !== undefined &&
    data.turnaroundTime < 0
  ) {
    throw new Error("Turnaround time cannot be negative");
  }

  return prisma.scanService.update({
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

export async function deleteScanService(
  scanCenterId: string,
  scanServiceId: string,
) {
  // Check service belongs to this scan center
  const existingService =
    await prisma.scanService.findFirst({
      where: {
        scanServiceId,
        scanCenterId,
      },
    });

  if (!existingService) {
    throw new Error("Scan service not found");
  }

  return prisma.scanService.delete({
    where: {
      scanServiceId,
    },
    include: {
      serviceCatalog: true,
    },
  });
}