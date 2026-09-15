import { Router } from "express";

import {
  createCollectorAssignmentController,
  createCollectorController,
  createHomeCollectionController,
  createHomeCollectionTrackingController,
  deleteCollectorAssignmentController,
  deleteCollectorController,
  getCollectorAssignmentByIdController,
  getCollectorAssignmentsController,
  getCollectorByIdController,
  getCollectorsByLabController,
  getCollectorsController,
  getHomeCollectionByAppointmentIdController,
  getHomeCollectionByIdController,
  getHomeCollectionTrackingByIdController,
  getHomeCollectionTrackingController,
  getHomeCollectionsController,
  updateCollectorAssignmentController,
  updateCollectorController,
  updateHomeCollectionController,
} from "../controllers/homecollection.controller";

const router = Router();

// =========================================================
// HOME COLLECTION
// =========================================================

router.post(
  "/homecollection",
  createHomeCollectionController,
);

router.get(
  "/homecollection",
  getHomeCollectionsController,
);

router.get(
  "/homecollection/appointment/:appointmentId",
  getHomeCollectionByAppointmentIdController,
);

router.get(
  "/homecollection/:homeCollectionId",
  getHomeCollectionByIdController,
);

router.put(
  "/homecollection/:homeCollectionId",
  updateHomeCollectionController,
);

// =========================================================
// COLLECTOR
// =========================================================

router.post(
  "/collector",
  createCollectorController,
);

router.get(
  "/collector",
  getCollectorsController,
);

router.get(
  "/collector/lab/:labId",
  getCollectorsByLabController,
);

router.get(
  "/collector/:collectorId",
  getCollectorByIdController,
);

router.put(
  "/collector/:collectorId",
  updateCollectorController,
);

router.delete(
  "/collector/:collectorId",
  deleteCollectorController,
);

// =========================================================
// COLLECTOR ASSIGNMENT
// =========================================================

router.post(
  "/collectorassignment",
  createCollectorAssignmentController,
);

router.get(
  "/collectorassignment",
  getCollectorAssignmentsController,
);

router.get(
  "/collectorassignment/:collectorAssignmentId",
  getCollectorAssignmentByIdController,
);

router.put(
  "/collectorassignment/:collectorAssignmentId",
  updateCollectorAssignmentController,
);

router.delete(
  "/collectorassignment/:collectorAssignmentId",
  deleteCollectorAssignmentController,
);

// =========================================================
// HOME COLLECTION TRACKING
// =========================================================

router.post(
  "/homecollectiontracking",
  createHomeCollectionTrackingController,
);

router.get(
  "/homecollectiontracking/homecollection/:homeCollectionId",
  getHomeCollectionTrackingController,
);

router.get(
  "/homecollectiontracking/:trackingId",
  getHomeCollectionTrackingByIdController,
);

export default router;