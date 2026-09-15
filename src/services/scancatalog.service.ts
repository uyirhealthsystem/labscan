
import { prisma } from "./prisma.service";
import { CatalogStatus } from "../generated/prisma/client";

export interface CreateScanServiceCatalogInput {
  code: string;
  name: string;
  description?: string;
  category?: string;
  status?: CatalogStatus;
}

export interface UpdateScanServiceCatalogInput {
  code?: string;
  name?: string;
  description?: string;
  category?: string;
  status?: CatalogStatus;
}

// =========================================================
// CREATE SCAN SERVICE CATALOG
// =========================================================

export async function createScanServiceCatalog(
  data: CreateScanServiceCatalogInput,
) {
  const existing = await prisma.scanServiceCatalog.findUnique({
    where: {
      code: data.code,
    },
  });

  if (existing) {
    throw new Error(
      `Scan service catalog with code ${data.code} already exists`,
    );
  }

  return prisma.scanServiceCatalog.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
      category: data.category,
      status: data.status ?? CatalogStatus.ACTIVE,
    },
  });
}

// =========================================================
// GET ALL SCAN SERVICE CATALOGS
// =========================================================

export async function getScanServiceCatalogs() {
  return prisma.scanServiceCatalog.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

// =========================================================
// GET SCAN SERVICE CATALOG BY ID
// =========================================================

export async function getScanServiceCatalogById(
  serviceCatalogId: string,
) {
  const catalog = await prisma.scanServiceCatalog.findUnique({
    where: {
      serviceCatalogId,
    },
  });

  if (!catalog) {
    throw new Error("Scan service catalog not found");
  }

  return catalog;
}

// =========================================================
// UPDATE SCAN SERVICE CATALOG
// =========================================================

export async function updateScanServiceCatalog(
  serviceCatalogId: string,
  data: UpdateScanServiceCatalogInput,
) {
  const existing = await prisma.scanServiceCatalog.findUnique({
    where: {
      serviceCatalogId,
    },
  });

  if (!existing) {
    throw new Error("Scan service catalog not found");
  }

  // Check duplicate code
  if (data.code) {
    const duplicate = await prisma.scanServiceCatalog.findFirst({
      where: {
        code: data.code,
        NOT: {
          serviceCatalogId,
        },
      },
    });

    if (duplicate) {
      throw new Error(
        `Scan service catalog with code ${data.code} already exists`,
      );
    }
  }

  return prisma.scanServiceCatalog.update({
    where: {
      serviceCatalogId,
    },
    data,
  });
}

// =========================================================
// DELETE SCAN SERVICE CATALOG
// =========================================================

export async function deleteScanServiceCatalog(
  serviceCatalogId: string,
) {
  const existing = await prisma.scanServiceCatalog.findUnique({
    where: {
      serviceCatalogId,
    },
  });

  if (!existing) {
    throw new Error("Scan service catalog not found");
  }

  return prisma.scanServiceCatalog.delete({
    where: {
      serviceCatalogId,
    },
  });
}

