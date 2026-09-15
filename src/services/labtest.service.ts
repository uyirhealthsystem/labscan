import { prisma } from "./prisma.service";
import { LabTestStatus } from "../generated/prisma/client";

export interface CreateLabTestInput {
  labId: string;
  testCatalogId: string;
  price?: number;
  turnaroundTime?: number;
  status?: LabTestStatus;
}

export interface UpdateLabTestInput {
  price?: number;
  turnaroundTime?: number;
  status?: LabTestStatus;
}


// =========================================================
// CREATE LAB TEST
// =========================================================

export async function createLabTest(
  data: CreateLabTestInput,
) {
  // 1. Check whether lab exists
  const lab = await prisma.lab.findUnique({
    where: {
      labId: data.labId,
    },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  // 2. Check whether catalog test exists
  const catalogTest = await prisma.labTestCatalog.findUnique({
    where: {
      testCatalogId: data.testCatalogId,
    },
  });

  if (!catalogTest) {
    throw new Error("Lab test catalog not found");
  }

  // 3. Check whether this test is already added to the lab
  const existingTest = await prisma.labTest.findUnique({
    where: {
      labId_testCatalogId: {
        labId: data.labId,
        testCatalogId: data.testCatalogId,
      },
    },
  });

  if (existingTest) {
    throw new Error("This test is already available in the lab");
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

  // 6. Create lab test
  return prisma.labTest.create({
    data: {
      labId: data.labId,
      testCatalogId: data.testCatalogId,
      price: data.price,
      turnaroundTime: data.turnaroundTime,
      status: data.status ?? LabTestStatus.ACTIVE,
    },
    include: {
      testCatalog: true,
    },
  });
}

// =========================================================
// GET ALL TESTS FOR A LAB
// =========================================================

export async function getLabTests(labId: string) {
  const lab = await prisma.lab.findUnique({
    where: {
      labId,
    },
  });

  if (!lab) {
    throw new Error("Lab not found");
  }

  return prisma.labTest.findMany({
    where: {
      labId,
    },
    include: {
      lab: {
        select: {
          name: true,
        },
      },
      testCatalog: {
        select: {
          testCatalogId: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}


// =========================================================
// GET SINGLE LAB TEST
// =========================================================

export async function getLabTestById(
  labId: string,
  labTestId: string,
) {
  const labTest = await prisma.labTest.findFirst({
    where: {
      labTestId,
      labId,
    },
    include: {
      testCatalog: true,
    },
  });

  if (!labTest) {
    throw new Error("Lab test not found");
  }

  return labTest;
}


// =========================================================
// UPDATE LAB TEST
// =========================================================

export async function updateLabTest(
  labId: string,
  labTestId: string,
  data: UpdateLabTestInput,
) {
  // 1. Find the test belonging to this lab
  const existingTest = await prisma.labTest.findFirst({
    where: {
      labTestId,
      labId,
    },
  });

  if (!existingTest) {
    throw new Error("Lab test not found");
  }

  // 2. Validate price
  if (data.price !== undefined && data.price < 0) {
    throw new Error("Price cannot be negative");
  }

  // 3. Validate turnaround time
  if (
    data.turnaroundTime !== undefined &&
    data.turnaroundTime < 0
  ) {
    throw new Error("Turnaround time cannot be negative");
  }

  // 4. Update
  return prisma.labTest.update({
    where: {
      labTestId,
    },
    data: {
      price: data.price,
      turnaroundTime: data.turnaroundTime,
      status: data.status,
    },
    include: {
      testCatalog: true,
    },
  });
}


// =========================================================
// DELETE LAB TEST
// =========================================================

export async function deleteLabTest(
  labId: string,
  labTestId: string,
) {
  // Check test belongs to this lab
  const existingTest = await prisma.labTest.findFirst({
    where: {
      labTestId,
      labId,
    },
  });

  if (!existingTest) {
    throw new Error("Lab test not found");
  }

  return prisma.labTest.delete({
    where: {
      labTestId,
    },
    include: {
      testCatalog: true,
    },
  });
}