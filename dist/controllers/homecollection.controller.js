"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushHomeCollectionToIndependentPoolController = exports.getHomeCollectionTrackingByIdController = exports.getHomeCollectionTrackingController = exports.createHomeCollectionTrackingController = exports.deleteCollectorAssignmentController = exports.updateCollectorAssignmentController = exports.getCollectorAssignmentByIdController = exports.getCollectorAssignmentsController = exports.rejectMyCollectorBookingOfferController = exports.acceptMyCollectorBookingOfferController = exports.getMyCollectorBookingOffersController = exports.getMyCollectorBookingsController = exports.getMyCollectorHistoryController = exports.getMyCollectorDashboardController = exports.updateMyCollectorLocationController = exports.updateMyCollectorProfileController = exports.getMyCollectorProfileController = exports.deleteCollectorController = exports.updateCollectorController = exports.getCollectorByIdController = exports.getCollectorsByLabController = exports.getCollectorsController = exports.createCollectorController = exports.getHomeCollectionHistoryController = exports.getHomeCollectionSummaryController = exports.updateHomeCollectionController = exports.getHomeCollectionByAppointmentIdController = exports.getHomeCollectionByIdController = exports.assignLabCollectorToHomeCollectionController = exports.acknowledgeHomeCollectionReceivedController = exports.assignLabCollectorController = exports.acknowledgeHomeCollectionController = exports.getMyHomeCollectionByIdController = exports.getMyHomeCollectionHistoryController = exports.getMyHomeCollectionBookingsController = exports.getHomeCollectionsController = exports.createHomeCollectionController = void 0;
const apiError_1 = require("../utils/apiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const homecollection_service_1 = require("../services/homecollection.service");
/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */
function getUserId(req) {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    if (typeof userId !== "string" || !userId.trim()) {
        throw new apiError_1.apiError(401, "User authentication required");
    }
    if (typeof userRole !== "string" || !userRole.trim()) {
        throw new apiError_1.apiError(401, "User role for authentication required");
    }
    return userId.trim();
}
function getUserRole(req) {
    const userRole = req.headers["x-user-role"];
    if (typeof userRole !== "string" || !userRole.trim()) {
        throw new apiError_1.apiError(401, "User role for authentication required");
    }
    return userRole.trim();
}
function sendSuccess(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}
/* -------------------------------------------------------------------------- */
/*                              HOME COLLECTION                               */
/* -------------------------------------------------------------------------- */
exports.createHomeCollectionController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, homecollection_service_1.createHomeCollection)(req.body);
    return sendSuccess(res, "Home collection booking created successfully", result, 201);
});
exports.getHomeCollectionsController = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const result = await (0, homecollection_service_1.getHomeCollections)();
    return sendSuccess(res, "Home collections fetched successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                         PATIENT HOME COLLECTION                            */
/* -------------------------------------------------------------------------- */
// Get all active home collection bookings for the authenticated patient.
exports.getMyHomeCollectionBookingsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    const result = await (0, homecollection_service_1.getMyHomeCollectionBookings)(userId);
    return sendSuccess(res, "Your home collection bookings fetched successfully", result);
});
// Get completed and cancelled home collection bookings.
exports.getMyHomeCollectionHistoryController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const result = await (0, homecollection_service_1.getMyHomeCollectionHistory)(userId);
    return sendSuccess(res, "Your home collection history fetched successfully", result);
});
// Get one home collection booking belonging to the authenticated patient.
exports.getMyHomeCollectionByIdController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const homeCollectionId = req.params.homeCollectionId;
    if (!homeCollectionId?.trim()) {
        throw new apiError_1.apiError(400, "Home collection ID is required");
    }
    const result = await (0, homecollection_service_1.getMyHomeCollectionById)(homeCollectionId, userId);
    return sendSuccess(res, "Your home collection booking fetched successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                     LAB ACKNOWLEDGEMENT AND ASSIGNMENT                     */
/* -------------------------------------------------------------------------- */
// Lab acknowledges receipt of a booking.
// Lab identity comes exclusively from authenticated request context.
exports.acknowledgeHomeCollectionController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const homeCollectionId = req.params.homeCollectionId;
    const labUserId = getUserId(req);
    if (!homeCollectionId?.trim()) {
        throw new apiError_1.apiError(400, "Home collection ID is required");
    }
    const result = await (0, homecollection_service_1.acknowledgeHomeCollectionReceived)(homeCollectionId, labUserId);
    return sendSuccess(res, "Home collection booking acknowledged; five-minute assignment timer started", result);
});
// Lab assigns its own collector.
exports.assignLabCollectorController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const homeCollectionId = req.params.homeCollectionId;
    const labUserId = getUserId(req);
    const { collectorId } = req.body;
    if (!homeCollectionId?.trim()) {
        throw new apiError_1.apiError(400, "Home collection ID is required");
    }
    if (typeof collectorId !== "string" ||
        !collectorId.trim()) {
        throw new apiError_1.apiError(400, "Valid collectorId is required");
    }
    const result = await (0, homecollection_service_1.assignLabCollectorToHomeCollection)(homeCollectionId, collectorId.trim(), labUserId);
    return sendSuccess(res, "Lab collector assigned successfully", result, 201);
});
// Backward-compatible exports for older router imports.
exports.acknowledgeHomeCollectionReceivedController = exports.acknowledgeHomeCollectionController;
exports.assignLabCollectorToHomeCollectionController = exports.assignLabCollectorController;
/* -------------------------------------------------------------------------- */
/*                            HOME COLLECTION GET                             */
/* -------------------------------------------------------------------------- */
exports.getHomeCollectionByIdController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const homeCollectionId = req.params.homeCollectionId;
    const result = await (0, homecollection_service_1.getHomeCollectionById)(homeCollectionId);
    return sendSuccess(res, "Home collection fetched successfully", result);
});
exports.getHomeCollectionByAppointmentIdController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const appointmentId = req.params.appointmentId;
    const result = await (0, homecollection_service_1.getHomeCollectionByAppointmentId)(appointmentId);
    return sendSuccess(res, "Home collection fetched successfully", result);
});
exports.updateHomeCollectionController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const homeCollectionId = req.params.homeCollectionId;
    // IMPORTANT:
    // The service must independently enforce an allowlist of editable fields.
    // Do not allow generic updates to bypass lab acknowledgement,
    // assignment ownership, or the five-minute deadline.
    const result = await (0, homecollection_service_1.updateHomeCollection)(homeCollectionId, req.body);
    return sendSuccess(res, "Home collection updated successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                            HOME COLLECTION SUMMARY                         */
/* -------------------------------------------------------------------------- */
exports.getHomeCollectionSummaryController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const labUserId = getUserId(req);
    const result = await (0, homecollection_service_1.getHomeCollectionSummary)(labUserId);
    return sendSuccess(res, "Home collection summary fetched successfully", result);
});
exports.getHomeCollectionHistoryController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const homeCollectionId = req.params.homeCollectionId;
    const labUserId = getUserId(req);
    const result = await (0, homecollection_service_1.getHomeCollectionHistory)(homeCollectionId, labUserId);
    return sendSuccess(res, "Home collection history fetched successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                                  COLLECTOR                                 */
/* -------------------------------------------------------------------------- */
exports.createCollectorController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const result = await (0, homecollection_service_1.createCollector)({
        ...req.body,
        userId,
    });
    return sendSuccess(res, "Collector created successfully", result, 201);
});
exports.getCollectorsController = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const result = await (0, homecollection_service_1.getCollectors)();
    return sendSuccess(res, "Collectors fetched successfully", result);
});
exports.getCollectorsByLabController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const labId = req.params.labId;
    const result = await (0, homecollection_service_1.getCollectorsByLab)(labId);
    return sendSuccess(res, "Lab collectors fetched successfully", result);
});
exports.getCollectorByIdController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const collectorId = req.params.collectorId;
    const result = await (0, homecollection_service_1.getCollectorById)(collectorId);
    return sendSuccess(res, "Collector fetched successfully", result);
});
exports.updateCollectorController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const collectorId = req.params.collectorId;
    const result = await (0, homecollection_service_1.updateCollector)(collectorId, req.body);
    return sendSuccess(res, "Collector updated successfully", result);
});
exports.deleteCollectorController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const collectorId = req.params.collectorId;
    const result = await (0, homecollection_service_1.deleteCollector)(collectorId);
    return sendSuccess(res, "Collector deleted successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                           COLLECTOR PROFILE                                */
/* -------------------------------------------------------------------------- */
exports.getMyCollectorProfileController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const result = await (0, homecollection_service_1.getMyCollectorProfile)(userId);
    return sendSuccess(res, "Collector profile fetched successfully", result);
});
exports.updateMyCollectorProfileController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const profile = await (0, homecollection_service_1.getMyCollectorProfile)(userId);
    const result = await (0, homecollection_service_1.updateCollector)(profile.collectorId, req.body);
    return sendSuccess(res, "Collector profile updated successfully", result);
});
exports.updateMyCollectorLocationController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const { latitude, longitude, isAvailable } = req.body;
    if (typeof latitude !== "number" ||
        typeof longitude !== "number") {
        throw new apiError_1.apiError(400, "Latitude and longitude must be numbers");
    }
    if (isAvailable !== undefined &&
        typeof isAvailable !== "boolean") {
        throw new apiError_1.apiError(400, "isAvailable must be a boolean");
    }
    const result = await (0, homecollection_service_1.updateMyCollectorLocation)(userId, latitude, longitude, isAvailable);
    return sendSuccess(res, "Collector location updated successfully", result);
});
exports.getMyCollectorDashboardController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const result = await (0, homecollection_service_1.getMyCollectorDashboard)(userId);
    return sendSuccess(res, "Collector dashboard fetched successfully", result);
});
exports.getMyCollectorHistoryController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const result = await (0, homecollection_service_1.getMyCollectorHistory)(userId);
    return sendSuccess(res, "Collector history fetched successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                          COLLECTOR BOOKING OFFERS                          */
/* -------------------------------------------------------------------------- */
exports.getMyCollectorBookingsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const result = await (0, homecollection_service_1.getMyCollectorBookings)(userId);
    return sendSuccess(res, "Collector bookings fetched successfully", result);
});
exports.getMyCollectorBookingOffersController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const result = await (0, homecollection_service_1.getMyCollectorBookingOffers)(userId);
    return sendSuccess(res, "Collector booking offers fetched successfully", result);
});
exports.acceptMyCollectorBookingOfferController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const offerId = req.params.offerId;
    const result = await (0, homecollection_service_1.acceptMyCollectorBookingOffer)(offerId, userId);
    return sendSuccess(res, "Booking offer accepted successfully", result);
});
exports.rejectMyCollectorBookingOfferController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = getUserId(req);
    const offerId = req.params.offerId;
    const result = await (0, homecollection_service_1.rejectMyCollectorBookingOffer)(offerId, userId);
    return sendSuccess(res, "Booking offer rejected successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                            COLLECTOR ASSIGNMENT                            */
/* -------------------------------------------------------------------------- */
exports.getCollectorAssignmentsController = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const result = await (0, homecollection_service_1.getCollectorAssignments)();
    return sendSuccess(res, "Collector assignments fetched successfully", result);
});
exports.getCollectorAssignmentByIdController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const collectorAssignmentId = req.params.collectorAssignmentId;
    const result = await (0, homecollection_service_1.getCollectorAssignmentById)(collectorAssignmentId);
    return sendSuccess(res, "Collector assignment fetched successfully", result);
});
exports.updateCollectorAssignmentController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const collectorAssignmentId = req.params.collectorAssignmentId;
    const result = await (0, homecollection_service_1.updateCollectorAssignment)(collectorAssignmentId, req.body);
    return sendSuccess(res, "Collector assignment updated successfully", result);
});
exports.deleteCollectorAssignmentController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const collectorAssignmentId = req.params.collectorAssignmentId;
    const result = await (0, homecollection_service_1.deleteCollectorAssignment)(collectorAssignmentId);
    return sendSuccess(res, "Collector assignment deleted successfully", result);
});
/* -------------------------------------------------------------------------- */
/*                         HOME COLLECTION TRACKING                           */
/* -------------------------------------------------------------------------- */
exports.createHomeCollectionTrackingController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, homecollection_service_1.createHomeCollectionTracking)(req.body);
    return sendSuccess(res, "Tracking event created successfully", result, 201);
});
exports.getHomeCollectionTrackingController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const homeCollectionId = req.params.homeCollectionId;
    const result = await (0, homecollection_service_1.getHomeCollectionTracking)(homeCollectionId);
    return sendSuccess(res, "Home collection tracking fetched successfully", result);
});
exports.getHomeCollectionTrackingByIdController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const trackingId = req.params.trackingId;
    const result = await (0, homecollection_service_1.getHomeCollectionTrackingById)(trackingId);
    return sendSuccess(res, "Tracking event fetched successfully", result);
});
exports.pushHomeCollectionToIndependentPoolController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const homeCollectionId = req.params.homeCollectionId;
    const labUserId = getUserId(req);
    if (!homeCollectionId?.trim()) {
        throw new apiError_1.apiError(400, "Home collection ID is required");
    }
    const result = await (0, homecollection_service_1.pushHomeCollectionToIndependentPool)(homeCollectionId, labUserId);
    return sendSuccess(res, "Home collection pushed into independent collector pool", result);
});
//# sourceMappingURL=homecollection.controller.js.map