"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanServiceCatalog = createScanServiceCatalog;
exports.getScanServiceCatalogs = getScanServiceCatalogs;
exports.getScanServiceCatalogById = getScanServiceCatalogById;
exports.updateScanServiceCatalog = updateScanServiceCatalog;
exports.deleteScanServiceCatalog = deleteScanServiceCatalog;
const prisma_service_1 = require("./prisma.service");
const client_1 = require("../generated/prisma/client");
// =========================================================
// CREATE SCAN SERVICE CATALOG
// =========================================================
async function createScanServiceCatalog(data) {
    const existing = await prisma_service_1.prisma.scanServiceCatalog.findUnique({
        where: {
            code: data.code,
        },
    });
    if (existing) {
        throw new Error(`Scan service catalog with code ${data.code} already exists`);
    }
    return prisma_service_1.prisma.scanServiceCatalog.create({
        data: {
            code: data.code,
            name: data.name,
            description: data.description,
            category: data.category,
            status: data.status ?? client_1.CatalogStatus.ACTIVE,
        },
    });
}
// =========================================================
// GET ALL SCAN SERVICE CATALOGS
// =========================================================
async function getScanServiceCatalogs() {
    return prisma_service_1.prisma.scanServiceCatalog.findMany({
        orderBy: {
            name: "asc",
        },
    });
}
// =========================================================
// GET SCAN SERVICE CATALOG BY ID
// =========================================================
async function getScanServiceCatalogById(serviceCatalogId) {
    const catalog = await prisma_service_1.prisma.scanServiceCatalog.findUnique({
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
async function updateScanServiceCatalog(serviceCatalogId, data) {
    const existing = await prisma_service_1.prisma.scanServiceCatalog.findUnique({
        where: {
            serviceCatalogId,
        },
    });
    if (!existing) {
        throw new Error("Scan service catalog not found");
    }
    // Check duplicate code
    if (data.code) {
        const duplicate = await prisma_service_1.prisma.scanServiceCatalog.findFirst({
            where: {
                code: data.code,
                NOT: {
                    serviceCatalogId,
                },
            },
        });
        if (duplicate) {
            throw new Error(`Scan service catalog with code ${data.code} already exists`);
        }
    }
    return prisma_service_1.prisma.scanServiceCatalog.update({
        where: {
            serviceCatalogId,
        },
        data,
    });
}
// =========================================================
// DELETE SCAN SERVICE CATALOG
// =========================================================
async function deleteScanServiceCatalog(serviceCatalogId) {
    const existing = await prisma_service_1.prisma.scanServiceCatalog.findUnique({
        where: {
            serviceCatalogId,
        },
    });
    if (!existing) {
        throw new Error("Scan service catalog not found");
    }
    return prisma_service_1.prisma.scanServiceCatalog.delete({
        where: {
            serviceCatalogId,
        },
    });
}
//# sourceMappingURL=scancatalog.service.js.map