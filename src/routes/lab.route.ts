import { Router } from "express";

import {createLabController,deleteLabController,getLabByIdController,getLabsController,updateLabController} from "../controllers/lab.controller";

import {
  createLabTestCatalogController,
  deleteLabTestCatalogController,
  getLabTestCatalogByIdController,
  getLabTestCatalogsController,
  updateLabTestCatalogController,
} from "../controllers/labtest.catalog.controller";

import {
  createLabTestController,
  getLabTestsController,
  getLabTestByIdController,
  updateLabTestController,
  deleteLabTestController,
} from "../controllers/labtest.controller";

const router = Router();

// Create // Get all // Get one // Update // Delete

router.post("/lab", createLabController);

router.get("/labs", getLabsController);

router.get("/labs/:labId", getLabByIdController);

router.patch("/labs/:labId", updateLabController);

router.delete("/labs/:labId", deleteLabController);


// this labtest catalog is strictly for superadmin it consists of codes of test details

router.post("/labtestcatalog",createLabTestCatalogController);

router.get("/labtestcatalogs",getLabTestCatalogsController);

router.get("/labtestcatalogs/:testCatalogId",getLabTestCatalogByIdController);

router.patch("/labtestcatalogs/:testCatalogId",updateLabTestCatalogController);

router.delete("/labtestcatalog/:testCatalogId",deleteLabTestCatalogController);



router.post("/lab/test",createLabTestController);

router.get("/labs/:labId/tests",getLabTestsController);

router.get("/labs/:labId/tests/:labTestId",getLabTestByIdController);

router.patch("/labs/:labId/tests/:labTestId",updateLabTestController);

router.delete("/labs/:labId/tests/:labTestId",deleteLabTestController);

export default router;