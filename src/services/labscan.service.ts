
import { prisma } from "./prisma.service";

// =========================================================
// GET LAB + SCAN DATA BY USER ID
// =========================================================

export async function getLabScanByUserId(userId: string) {
  const [labs, scanCenters] = await Promise.all([
    prisma.lab.findMany({
      where: {
        labUserId: userId,
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

    prisma.scanCenter.findMany({
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
