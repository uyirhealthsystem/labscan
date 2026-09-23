import { Router } from "express";

import { createScanCenterController, deleteScanCenterController, getScanCenterByIdController, getScanCentersController, updateScanCenterController,getScanCentersByUserIdController } from "../controllers/scan.controller";

import { createScanServiceController, getScanServicesController, getScanServiceByIdController, updateScanServiceController, deleteScanServiceController } from "../controllers/scanservice.controller";

import {
    createScanServiceCatalogController,
    getScanServiceCatalogsController,
    getScanServiceCatalogByIdController,
    updateScanServiceCatalogController,
    deleteScanServiceCatalogController,
} from "../controllers/scancatalog.controller";
const router = Router();

// SCAN CENTER ROUTES

router.post("/scancenter", createScanCenterController);
router.get("/scancenters", getScanCentersController);
router.get("/scancenters/:scanCenterId", getScanCenterByIdController);
router.patch("/scancenters/:scanCenterId", updateScanCenterController);
router.delete("/scancenters/:scanCenterId", deleteScanCenterController);
router.get("/scancenters/user", getScanCentersByUserIdController);

// =========================================================
// SCAN SERVICE
// =========================================================

router.post("/scanservice", createScanServiceController);

router.get("/scanservices/:scanCenterId", getScanServicesController);

router.get("/scanservices/:scanCenterId/:scanServiceId", getScanServiceByIdController);

router.patch("/scanservices/:scanCenterId/:scanServiceId", updateScanServiceController);

router.delete(
    "/scanservices/:scanCenterId/:scanServiceId",
    deleteScanServiceController,
);


// =========================================================
// SCAN SERVICE CATALOG
// =========================================================

router.post(
    "/scanservicecatalog",
    createScanServiceCatalogController,
);

router.get(
    "/scanservicecatalogs",
    getScanServiceCatalogsController,
);

router.get(
    "/scanservicecatalog/:serviceCatalogId",
    getScanServiceCatalogByIdController,
);

router.patch(
    "/scanservicecatalog/:serviceCatalogId",
    updateScanServiceCatalogController,
);

router.delete(
    "/scanservicecatalog/:serviceCatalogId",
    deleteScanServiceCatalogController,
);

export default router;