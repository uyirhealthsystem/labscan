"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lab_controller_1 = require("../controllers/lab.controller");
const labtest_catalog_controller_1 = require("../controllers/labtest.catalog.controller");
const labtest_controller_1 = require("../controllers/labtest.controller");
const router = (0, express_1.Router)();
// Create // Get all // Get one // Update // Delete
router.post("/lab", lab_controller_1.createLabController);
router.get("/labs", lab_controller_1.getLabsController);
router.get("/labs/district/:districtId", lab_controller_1.getLabsByDistrictController);
router.get("/labs/user", lab_controller_1.getLabsByUserIdController);
router.get("/labs/:labId", lab_controller_1.getLabByIdController);
router.patch("/labs/:labId", lab_controller_1.updateLabController);
router.delete("/labs/:labId", lab_controller_1.deleteLabController);
router.get("/labs/district/:districtId/metrics", lab_controller_1.getLabMetricsByDistrictController);
// this labtest catalog is strictly for superadmin it consists of codes of test details
router.post("/labtestcatalog", labtest_catalog_controller_1.createLabTestCatalogController);
router.get("/labtestcatalogs", labtest_catalog_controller_1.getLabTestCatalogsController);
router.get("/labtestcatalogs/:testCatalogId", labtest_catalog_controller_1.getLabTestCatalogByIdController);
router.patch("/labtestcatalogs/:testCatalogId", labtest_catalog_controller_1.updateLabTestCatalogController);
router.delete("/labtestcatalog/:testCatalogId", labtest_catalog_controller_1.deleteLabTestCatalogController);
router.post("/lab/test", labtest_controller_1.createLabTestController);
router.get("/labs/:labId/tests", labtest_controller_1.getLabTestsController);
router.get("/labs/:labId/tests/:labTestId", labtest_controller_1.getLabTestByIdController);
router.patch("/labs/:labId/tests/:labTestId", labtest_controller_1.updateLabTestController);
router.delete("/labs/:labId/tests/:labTestId", labtest_controller_1.deleteLabTestController);
exports.default = router;
//# sourceMappingURL=lab.route.js.map