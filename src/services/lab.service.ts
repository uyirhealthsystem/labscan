import { prisma } from "./prisma.service";
import { LabStatus } from "../generated/prisma/client";

export interface CreateLabInput {
  labUserId: string;
  name: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  districtId?: string;
  status?: LabStatus;
}

export interface UpdateLabInput {
  name?: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  districtId?: string;
  status?: LabStatus;
}

// =========================================================
// CREATE LAB
// =========================================================

export async function createLab(data: CreateLabInput) {
  if (data.registrationNumber) {
    const existingRegistration = await prisma.lab.findFirst({
      where: {
        registrationNumber: data.registrationNumber,
      },
    });

    if (existingRegistration) {
      throw new Error("Registration number already exists");
    }
  }

  return prisma.lab.create({
    data: {
      labUserId: data.labUserId,
      name: data.name,
      registrationNumber: data.registrationNumber,
      phone: data.phone,
      email: data.email,
      address: data.address,
      districtId: data.districtId,
      status: data.status ?? LabStatus.ACTIVE,
    },
  });
}

// =========================================================
// GET ALL LABS
// =========================================================

export async function getLabs() {
  return prisma.lab.findMany({
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
  });
}

// =========================================================
// GET LAB BY ID
// =========================================================

export async function getLabById(labId: string) {
  const lab = await prisma.lab.findUnique({
    where: {
      labId,
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
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  return lab;
}

// =========================================================
// UPDATE LAB
// =========================================================

export async function updateLab(
  labId: string,
  data: UpdateLabInput,
) {
  const existingLab = await prisma.lab.findUnique({
    where: {
      labId,
    },
  });

  if (!existingLab) {
    throw new Error("Lab not found");
  }

  if (data.registrationNumber) {
    const existingRegistration = await prisma.lab.findFirst({
      where: {
        registrationNumber: data.registrationNumber,
        NOT: {
          labId,
        },
      },
    });

    if (existingRegistration) {
      throw new Error("Registration number already exists");
    }
  }

  return prisma.lab.update({
    where: {
      labId,
    },
    data,
  });
}

// =========================================================
// DELETE LAB
// =========================================================

export async function deleteLab(labId: string) {
  const existingLab = await prisma.lab.findUnique({
    where: {
      labId,
    },
  });

  if (!existingLab) {
    throw new Error("Lab not found");
  }

  return prisma.lab.delete({
    where: {
      labId,
    },
  });
}