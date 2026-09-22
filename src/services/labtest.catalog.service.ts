import { prisma } from "./prisma.service";

// =========================================================
// CREATE INPUT
// =========================================================

export interface CreateLabTestCatalogInput {
  code: string;
  name: string;
  description?: string;
  category?: string;
  fastingRequirement?: "REQUIRED" | "NOT_REQUIRED" | "OPTIONAL";
  fastingHours?: number;
  preparationInstructions?: string;
  status?: "ACTIVE" | "INACTIVE";
}

// =========================================================
// UPDATE INPUT
// =========================================================

export interface UpdateLabTestCatalogInput {
  code?: string;
  name?: string;
  description?: string;
  category?: string;
  fastingRequirement?: "REQUIRED" | "NOT_REQUIRED" | "OPTIONAL";
  fastingHours?: number;
  preparationInstructions?: string;
  status?: "ACTIVE" | "INACTIVE";
}

// =========================================================
// CREATE LAB TEST CATALOG
// =========================================================

export async function createLabTestCatalog(
  data: CreateLabTestCatalogInput,
) {
  const existing = await prisma.labTestCatalog.findUnique({
    where: {
      code: data.code,
    },
  });

  if (existing) {
    throw new Error(
      `Lab test with code ${data.code} already exists`,
    );
  }

 return prisma.labTestCatalog.create({
  data: {
    code: data.code,
    name: data.name,
    description: data.description,
    category: data.category,
    fastingRequirement: data.fastingRequirement,
    fastingHours: data.fastingHours,
    preparationInstructions: data.preparationInstructions,
    status: data.status,
  },
});
}

// =========================================================
// GET ALL LAB TEST CATALOGS
// =========================================================

export async function getLabTestCatalogs() {
  return prisma.labTestCatalog.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

// =========================================================
// GET LAB TEST CATALOG BY ID
// =========================================================

export async function getLabTestCatalogById(
  testCatalogId: string,
) {
  const catalog = await prisma.labTestCatalog.findUnique({
    where: {
      testCatalogId,
    },
  });

  if (!catalog) {
    throw new Error("Lab test catalog not found");
  }

  return catalog;
}

// =========================================================
// UPDATE LAB TEST CATALOG
// =========================================================

export async function updateLabTestCatalog(
  testCatalogId: string,
  data: UpdateLabTestCatalogInput,
) {
  const existing = await prisma.labTestCatalog.findUnique({
    where: {
      testCatalogId,
    },
  });

  if (!existing) {
    throw new Error("Lab test catalog not found");
  }

  // Check duplicate code only when code is being changed
  if (data.code && data.code !== existing.code) {
    const duplicate = await prisma.labTestCatalog.findUnique({
      where: {
        code: data.code,
      },
    });

    if (duplicate) {
      throw new Error(
        `Lab test with code ${data.code} already exists`,
      );
    }
  }

 return prisma.labTestCatalog.update({
  where: {
    testCatalogId,
  },
  data: {
    code: data.code,
    name: data.name,
    description: data.description,
    category: data.category,
    fastingRequirement: data.fastingRequirement,
    fastingHours: data.fastingHours,
    preparationInstructions: data.preparationInstructions,
    status: data.status,
  },
});
}

// =========================================================
// DELETE LAB TEST CATALOG
// =========================================================

export async function deleteLabTestCatalog(
  testCatalogId: string,
) {
  const existing = await prisma.labTestCatalog.findUnique({
    where: {
      testCatalogId,
    },
  });

  if (!existing) {
    throw new Error("Lab test catalog not found");
  }

  return prisma.labTestCatalog.delete({
    where: {
      testCatalogId,
    },
  });
}