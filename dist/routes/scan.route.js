"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scan_controller_1 = require("../controllers/scan.controller");
const scanservice_controller_1 = require("../controllers/scanservice.controller");
const scancatalog_controller_1 = require("../controllers/scancatalog.controller");
const router = (0, express_1.Router)();
// SCAN CENTER ROUTES
router.post("/scancenter", scan_controller_1.createScanCenterController);
router.get("/scancenters", scan_controller_1.getScanCentersController);
router.get("/scancenters/district/:districtId", scan_controller_1.getScanCentersByDistrictController);
router.get("/scancenters/:scanCenterId", scan_controller_1.getScanCenterByIdController);
router.patch("/scancenters/:scanCenterId", scan_controller_1.updateScanCenterController);
router.patch("/scancenters/:scanCenterId", scan_controller_1.deleteScanCenterController);
router.get("/scancenters/user", scan_controller_1.getScanCentersByUserIdController);
router.get("/scancenters/district/:districtId/metrics", scan_controller_1.getScanCenterMetricsByDistrictController);
// =========================================================
// SCAN SERVICE
// =========================================================
router.post("/scanservice", scanservice_controller_1.createScanServiceController);
router.get("/scanservices/:scanCenterId", scanservice_controller_1.getScanServicesController);
router.get("/scanservices/:scanCenterId/:scanServiceId", scanservice_controller_1.getScanServiceByIdController);
router.patch("/scanservices/:scanCenterId/:scanServiceId", scanservice_controller_1.updateScanServiceController);
router.delete("/scanservices/:scanCenterId/:scanServiceId", scanservice_controller_1.deleteScanServiceController);
// =========================================================
// SCAN SERVICE CATALOG
// =========================================================
router.post("/scanservicecatalog", scancatalog_controller_1.createScanServiceCatalogController);
router.get("/scanservicecatalogs", scancatalog_controller_1.getScanServiceCatalogsController);
router.get("/scanservicecatalog/:serviceCatalogId", scancatalog_controller_1.getScanServiceCatalogByIdController);
router.patch("/scanservicecatalog/:serviceCatalogId", scancatalog_controller_1.updateScanServiceCatalogController);
router.patch("/scanservicecatalog/:serviceCatalogId", scancatalog_controller_1.deleteScanServiceCatalogController);
exports.default = router;
//# sourceMappingURL=scan.route.js.map