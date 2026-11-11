
import { Router } from "express";

import {
  createCollectorController,
  createHomeCollectionController,
  createHomeCollectionTrackingController,
  acknowledgeHomeCollectionController,
  assignLabCollectorController,
  pushHomeCollectionToIndependentPoolController,
  deleteCollectorController,
  deleteCollectorAssignmentController,

  getCollectorAssignmentByIdController,
  getCollectorAssignmentsController,
  getCollectorByIdController,
  getMyCollectorProfileController,
  getCollectorsByLabController,
  getCollectorsController,

  getMyCollectorBookingsController,
  getMyCollectorBookingOffersController,

  getHomeCollectionByAppointmentIdController,
  getHomeCollectionByIdController,
  getHomeCollectionTrackingByIdController,
  getHomeCollectionTrackingController,
  getHomeCollectionsController,

  updateCollectorAssignmentController,
  updateCollectorController,
  updateHomeCollectionController,

  acceptMyCollectorBookingOfferController,
  rejectMyCollectorBookingOfferController,
  updateMyCollectorLocationController,

  getHomeCollectionSummaryController,
  getHomeCollectionHistoryController,
  getMyCollectorHistoryController,
  getMyCollectorDashboardController,
  getMyHomeCollectionByIdController,
  getMyHomeCollectionHistoryController,
  getMyHomeCollectionBookingsController

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

// Keep specific routes before /homecollection/:homeCollectionId
router.get(
  "/homecollection/summary",
  getHomeCollectionSummaryController,
);

router.get(
  "/homecollection/me/bookings",
  getMyHomeCollectionBookingsController,
);

router.get(
  "/homecollection/me/history",
  getMyHomeCollectionHistoryController,
);

router.get(
  "/homecollection/me/:homeCollectionId",
  getMyHomeCollectionByIdController,
);
router.get(
  "/homecollection/appointment/:appointmentId",
  getHomeCollectionByAppointmentIdController,
);

router.get(
  "/homecollection/:homeCollectionId/history",
  getHomeCollectionHistoryController,
);

router.get(
  "/homecollection/:homeCollectionId",
  getHomeCollectionByIdController,
);

router.put(
  "/homecollection/:homeCollectionId",
  updateHomeCollectionController,
);

// Lab acknowledges receipt of a home collection booking
router.post(
  "/homecollection/:homeCollectionId/acknowledge",
  acknowledgeHomeCollectionController,
);

// Lab assigns one of its own collectors
router.post(
  "/homecollection/:homeCollectionId/assign-collector",
  assignLabCollectorController,
);

router.post(
  "/homecollection/:homeCollectionId/push-to-independent-pool",
  pushHomeCollectionToIndependentPoolController,
);
// =========================================================
// COLLECTOR MANAGEMENT
// =========================================================

router.post(
  "/collector",
  createCollectorController,
);

router.get(
  "/collectors",
  getCollectorsController,
);

router.get(
  "/collectors/me",
  getMyCollectorProfileController,
);

// Collector's current location and availability
router.patch(
  "/collectors/me/location",
  updateMyCollectorLocationController,
);

// Collector's bookings and offers
router.get(
  "/collectors/me/bookings",
  getMyCollectorBookingsController,
);

router.get(
  "/collectors/me/offers",
  getMyCollectorBookingOffersController,
);

// Accept or reject a booking offer using offerId
router.post(
  "/collectors/me/offers/:offerId/accept",
  acceptMyCollectorBookingOfferController,
);

router.post(
  "/collectors/me/offers/:offerId/reject",
  rejectMyCollectorBookingOfferController,
);

// Collector dashboard and history
router.get(
  "/collectors/me/dashboard",
  getMyCollectorDashboardController,
);

router.get(
  "/collectors/me/history",
  getMyCollectorHistoryController,
);

// Lab-specific collector listing
router.get(
  "/collector/lab/:labId",
  getCollectorsByLabController,
);

// Individual collector management
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
// COLLECTOR ASSIGNMENTS - ADMIN / MANAGEMENT
// =========================================================

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
