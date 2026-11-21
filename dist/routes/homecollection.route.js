"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homecollection_controller_1 = require("../controllers/homecollection.controller");
const router = (0, express_1.Router)();
// =========================================================
// HOME COLLECTION
// =========================================================
router.post("/homecollection", homecollection_controller_1.createHomeCollectionController);
router.get("/homecollection", homecollection_controller_1.getHomeCollectionsController);
// Keep specific routes before /homecollection/:homeCollectionId
router.get("/homecollection/summary", homecollection_controller_1.getHomeCollectionSummaryController);
router.get("/homecollection/me/bookings", homecollection_controller_1.getMyHomeCollectionBookingsController);
router.get("/homecollection/me/history", homecollection_controller_1.getMyHomeCollectionHistoryController);
router.get("/homecollection/me/:homeCollectionId", homecollection_controller_1.getMyHomeCollectionByIdController);
router.get("/homecollection/appointment/:appointmentId", homecollection_controller_1.getHomeCollectionByAppointmentIdController);
router.get("/homecollection/:homeCollectionId/history", homecollection_controller_1.getHomeCollectionHistoryController);
router.get("/homecollection/:homeCollectionId", homecollection_controller_1.getHomeCollectionByIdController);
router.put("/homecollection/:homeCollectionId", homecollection_controller_1.updateHomeCollectionController);
// Lab acknowledges receipt of a home collection booking
router.post("/homecollection/:homeCollectionId/acknowledge", homecollection_controller_1.acknowledgeHomeCollectionController);
// Lab assigns one of its own collectors
router.post("/homecollection/:homeCollectionId/assign-collector", homecollection_controller_1.assignLabCollectorController);
router.post("/homecollection/:homeCollectionId/push-to-independent-pool", homecollection_controller_1.pushHomeCollectionToIndependentPoolController);
// =========================================================
// COLLECTOR MANAGEMENT
// =========================================================
router.post("/collector", homecollection_controller_1.createCollectorController);
router.get("/collectors", homecollection_controller_1.getCollectorsController);
router.get("/collectors/me", homecollection_controller_1.getMyCollectorProfileController);
// Collector's current location and availability
router.patch("/collectors/me/location", homecollection_controller_1.updateMyCollectorLocationController);
router.patch("/collectors/me/profile", homecollection_controller_1.updateMyCollectorProfileController);
// Collector's bookings and offers
router.get("/collectors/me/bookings", homecollection_controller_1.getMyCollectorBookingsController);
router.get("/collectors/me/offers", homecollection_controller_1.getMyCollectorBookingOffersController);
// Accept or reject a booking offer using offerId
router.post("/collectors/me/offers/:offerId/accept", homecollection_controller_1.acceptMyCollectorBookingOfferController);
router.post("/collectors/me/offers/:offerId/reject", homecollection_controller_1.rejectMyCollectorBookingOfferController);
// Collector dashboard and history
router.get("/collectors/me/dashboard", homecollection_controller_1.getMyCollectorDashboardController);
router.get("/collectors/me/history", homecollection_controller_1.getMyCollectorHistoryController);
// Lab-specific collector listing
router.get("/collector/lab/:labId", homecollection_controller_1.getCollectorsByLabController);
// Individual collector management
router.get("/collector/:collectorId", homecollection_controller_1.getCollectorByIdController);
router.put("/collector/:collectorId", homecollection_controller_1.updateCollectorController);
router.delete("/collector/:collectorId", homecollection_controller_1.deleteCollectorController);
// =========================================================
// COLLECTOR ASSIGNMENTS - ADMIN / MANAGEMENT
// =========================================================
router.get("/collectorassignment", homecollection_controller_1.getCollectorAssignmentsController);
router.get("/collectorassignment/:collectorAssignmentId", homecollection_controller_1.getCollectorAssignmentByIdController);
router.put("/collectorassignment/:collectorAssignmentId", homecollection_controller_1.updateCollectorAssignmentController);
router.delete("/collectorassignment/:collectorAssignmentId", homecollection_controller_1.deleteCollectorAssignmentController);
// =========================================================
// HOME COLLECTION TRACKING
// =========================================================
router.post("/homecollectiontracking", homecollection_controller_1.createHomeCollectionTrackingController);
router.get("/homecollectiontracking/homecollection/:homeCollectionId", homecollection_controller_1.getHomeCollectionTrackingController);
router.get("/homecollectiontracking/:trackingId", homecollection_controller_1.getHomeCollectionTrackingByIdController);
exports.default = router;
//# sourceMappingURL=homecollection.route.js.map