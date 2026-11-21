"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabTest = createLabTest;
exports.getLabTests = getLabTests;
exports.getLabTestById = getLabTestById;
exports.updateLabTest = updateLabTest;
exports.deleteLabTest = deleteLabTest;
const prisma_service_1 = require("./prisma.service");
const client_1 = require("../generated/prisma/client");
// =========================================================
// CREATE LAB TEST
// =========================================================
async function createLabTest(data) {
    // 1. Check whether lab exists
    const lab = await prisma_service_1.prisma.lab.findUnique({
        where: {
            labId: data.labId,
        },
    });
    if (!lab) {
        throw new Error("Lab not found");
    }
    // 2. Check whether catalog test exists
    const catalogTest = await prisma_service_1.prisma.labTestCatalog.findUnique({
        where: {
            testCatalogId: data.testCatalogId,
        },
    });
    if (!catalogTest) {
        throw new Error("Lab test catalog not found");
    }
    // 3. Check whether this test is already added to the lab
    const existingTest = await prisma_service_1.prisma.labTest.findUnique({
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
    if (data.turnaroundTime !== undefined &&
        data.turnaroundTime < 0) {
        throw new Error("Turnaround time cannot be negative");
    }
    // 6. Create lab test
    return prisma_service_1.prisma.labTest.create({
        data: {
            labId: data.labId,
            testCatalogId: data.testCatalogId,
            price: data.price,
            turnaroundTime: data.turnaroundTime,
            status: data.status ?? client_1.LabTestStatus.ACTIVE,
        },
        include: {
            testCatalog: true,
        },
    });
}
// =========================================================
// GET ALL TESTS FOR A LAB
// =========================================================
async function getLabTests(labId) {
    const lab = await prisma_service_1.prisma.lab.findUnique({
        where: {
            labId,
        },
    });
    if (!lab) {
        throw new Error("Lab not found");
    }
    return prisma_service_1.prisma.labTest.findMany({
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
async function getLabTestById(labId, labTestId) {
    const labTest = await prisma_service_1.prisma.labTest.findFirst({
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
async function updateLabTest(labId, labTestId, data) {
    // 1. Find the test belonging to this lab
    const existingTest = await prisma_service_1.prisma.labTest.findFirst({
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
    if (data.turnaroundTime !== undefined &&
        data.turnaroundTime < 0) {
        throw new Error("Turnaround time cannot be negative");
    }
    // 4. Update
    return prisma_service_1.prisma.labTest.update({
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
async function deleteLabTest(labId, labTestId) {
    // Check test belongs to this lab
    const existingTest = await prisma_service_1.prisma.labTest.findFirst({
        where: {
            labTestId,
            labId,
        },
    });
    if (!existingTest) {
        throw new Error("Lab test not found");
    }
    return prisma_service_1.prisma.labTest.delete({
        where: {
            labTestId,
        },
        include: {
            testCatalog: true,
        },
    });
}
//# sourceMappingURL=labtest.service.js.map