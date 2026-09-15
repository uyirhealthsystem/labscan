import { prisma } from "./prisma.service";

export interface CreateEquipmentInput {
  scanCenterId: string;
  name: string;
  equipmentType: string;
  manufacturer?: string;
  modelNumber?: string;
  status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}

export interface UpdateEquipmentInput {
  name?: string;
  equipmentType?: string;
  manufacturer?: string;
  modelNumber?: string;
  status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}

export interface CreateEquipmentServiceInput {
  equipmentId: string;
  scanServiceId: string;
}

export async function createEquipment(data: CreateEquipmentInput) {
  const scanCenter = await prisma.scanCenter.findUnique({
    where: {
      scanCenterId: data.scanCenterId,
    },
  });

  if (!scanCenter) {
    throw new Error("Scan center not found");
  }

  return prisma.equipment.create({
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

export async function getEquipments() {
  return prisma.equipment.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEquipmentsByScanCenter(scanCenterId: string) {
  const scanCenter = await prisma.scanCenter.findUnique({
    where: {
      scanCenterId,
    },
  });

  if (!scanCenter) {
    throw new Error("Scan center not found");
  }

  return prisma.equipment.findMany({
    where: {
      scanCenterId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEquipmentById(equipmentId: string) {
  const equipment = await prisma.equipment.findUnique({
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

export async function updateEquipment(
  equipmentId: string,
  data: UpdateEquipmentInput,
) {
  const existingEquipment = await prisma.equipment.findUnique({
    where: {
      equipmentId,
    },
  });

  if (!existingEquipment) {
    throw new Error("Equipment not found");
  }

  return prisma.equipment.update({
    where: {
      equipmentId,
    },
    data,
  });
}

export async function deleteEquipment(equipmentId: string) {
  const existingEquipment = await prisma.equipment.findUnique({
    where: {
      equipmentId,
    },
  });

  if (!existingEquipment) {
    throw new Error("Equipment not found");
  }

  return prisma.equipment.delete({
    where: {
      equipmentId,
    },
  });
}

export async function createEquipmentService(
  data: CreateEquipmentServiceInput,
) {
  const equipment = await prisma.equipment.findUnique({
    where: {
      equipmentId: data.equipmentId,
    },
  });

  if (!equipment) {
    throw new Error("Equipment not found");
  }

  const scanService = await prisma.scanService.findUnique({
    where: {
      scanServiceId: data.scanServiceId,
    },
  });

  if (!scanService) {
    throw new Error("Scan service not found");
  }

  // Equipment and scan service must belong to the same scan center
  if (equipment.scanCenterId !== scanService.scanCenterId) {
    throw new Error(
      "Equipment and scan service must belong to the same scan center",
    );
  }

  const existing = await prisma.equipmentService.findUnique({
    where: {
      equipmentId_scanServiceId: {
        equipmentId: data.equipmentId,
        scanServiceId: data.scanServiceId,
      },
    },
  });

  if (existing) {
    throw new Error(
      "This equipment is already mapped to this scan service",
    );
  }

  return prisma.equipmentService.create({
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

export async function getEquipmentServices() {
  return prisma.equipmentService.findMany({
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

export async function getEquipmentServicesByEquipment(
  equipmentId: string,
) {
  const equipment = await prisma.equipment.findUnique({
    where: {
      equipmentId,
    },
  });

  if (!equipment) {
    throw new Error("Equipment not found");
  }

  return prisma.equipmentService.findMany({
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

export async function getEquipmentServicesByScanService(
  scanServiceId: string,
) {
  const scanService = await prisma.scanService.findUnique({
    where: {
      scanServiceId,
    },
  });

  if (!scanService) {
    throw new Error("Scan service not found");
  }

  return prisma.equipmentService.findMany({
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

export async function getEquipmentServiceById(
  equipmentServiceId: string,
) {
  const equipmentService = await prisma.equipmentService.findUnique({
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

export async function deleteEquipmentService(
  equipmentServiceId: string,
) {
  const existing = await prisma.equipmentService.findUnique({
    where: {
      equipmentServiceId,
    },
  });

  if (!existing) {
    throw new Error("Equipment service mapping not found");
  }

  return prisma.equipmentService.delete({
    where: {
      equipmentServiceId,
    },
  });
}