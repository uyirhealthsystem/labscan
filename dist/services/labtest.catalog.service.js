"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabTestCatalog = createLabTestCatalog;
exports.getLabTestCatalogs = getLabTestCatalogs;
exports.getLabTestCatalogById = getLabTestCatalogById;
exports.updateLabTestCatalog = updateLabTestCatalog;
exports.deleteLabTestCatalog = deleteLabTestCatalog;
const prisma_service_1 = require("./prisma.service");
// =========================================================
// CREATE LAB TEST CATALOG
// =========================================================
async function createLabTestCatalog(data) {
    const existing = await prisma_service_1.prisma.labTestCatalog.findUnique({
        where: {
            code: data.code,
        },
    });
    if (existing) {
        throw new Error(`Lab test with code ${data.code} already exists`);
    }
    return prisma_service_1.prisma.labTestCatalog.create({
        data: {
            code: data.code,
            name: data.name,
            description: data.description,
            sampleType: data.sampleType,
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
async function getLabTestCatalogs() {
    return prisma_service_1.prisma.labTestCatalog.findMany({
        orderBy: {
            name: "asc",
        },
    });
}
// =========================================================
// GET LAB TEST CATALOG BY ID
// =========================================================
async function getLabTestCatalogById(testCatalogId) {
    const catalog = await prisma_service_1.prisma.labTestCatalog.findUnique({
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
async function updateLabTestCatalog(testCatalogId, data) {
    const existing = await prisma_service_1.prisma.labTestCatalog.findUnique({
        where: {
            testCatalogId,
        },
    });
    if (!existing) {
        throw new Error("Lab test catalog not found");
    }
    // Check duplicate code only when code is being changed
    if (data.code && data.code !== existing.code) {
        const duplicate = await prisma_service_1.prisma.labTestCatalog.findUnique({
            where: {
                code: data.code,
            },
        });
        if (duplicate) {
            throw new Error(`Lab test with code ${data.code} already exists`);
        }
    }
    return prisma_service_1.prisma.labTestCatalog.update({
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
async function deleteLabTestCatalog(testCatalogId) {
    const existing = await prisma_service_1.prisma.labTestCatalog.findUnique({
        where: {
            testCatalogId,
        },
    });
    if (!existing) {
        throw new Error("Lab test catalog not found");
    }
    return prisma_service_1.prisma.labTestCatalog.delete({
        where: {
            testCatalogId,
        },
    });
}
//# sourceMappingURL=labtest.catalog.service.js.map