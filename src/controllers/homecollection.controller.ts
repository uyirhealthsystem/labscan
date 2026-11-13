
import type { Request, Response } from "express";

import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

import {
  createCollector,
  createHomeCollection,
  acknowledgeHomeCollectionReceived,
  assignLabCollectorToHomeCollection,
  createHomeCollectionTracking,
  deleteCollector as removeCollector,
  deleteCollectorAssignment,
  getCollectorAssignmentById,
  getCollectorAssignments,
  getCollectorById,
  getMyCollectorProfile,
  getCollectors,
  getCollectorsByLab,
  getHomeCollectionByAppointmentId,
  getHomeCollectionById,
  getHomeCollectionTracking,
  getHomeCollectionTrackingById,
  getHomeCollections,
  updateCollector,
  updateCollectorAssignment,
  updateHomeCollection,
  getMyCollectorBookings,
  getMyCollectorBookingOffers,
  acceptMyCollectorBookingOffer,
  rejectMyCollectorBookingOffer,
  updateMyCollectorLocation,
  getHomeCollectionSummary,
  getHomeCollectionHistory,
  getMyCollectorDashboard,
  getMyCollectorHistory,
  pushHomeCollectionToIndependentPool,
  getMyHomeCollectionBookings,
  getMyHomeCollectionHistory,
  getMyHomeCollectionById,
} from "../services/homecollection.service";

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getUserId(req: Request): string {
  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"]

  if (typeof userId !== "string" || !userId.trim()) {
    throw new apiError(401, "User authentication required");
  }

  if (typeof userRole !== "string" || !userRole.trim()) {
    throw new apiError(401, "User role for authentication required");
  }
  return userId.trim();
}

function getUserRole(req: Request): string {
  const userRole = req.headers["x-user-role"]

  if (typeof userRole !== "string" || !userRole.trim()) {
    throw new apiError(401, "User role for authentication required");
  }
  return userRole.trim();
}


function sendSuccess(
  res: Response,
  message: string,
  data: unknown,
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/* -------------------------------------------------------------------------- */
/*                              HOME COLLECTION                               */
/* -------------------------------------------------------------------------- */

export const createHomeCollectionController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await createHomeCollection(req.body);

    return sendSuccess(
      res,
      "Home collection booking created successfully",
      result,
      201,
    );
  },
);

export const getHomeCollectionsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getHomeCollections();

    return sendSuccess(
      res,
      "Home collections fetched successfully",
      result,
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                         PATIENT HOME COLLECTION                            */
/* -------------------------------------------------------------------------- */

// Get all active home collection bookings for the authenticated patient.

export const getMyHomeCollectionBookingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const result = await getMyHomeCollectionBookings(userId);

    return sendSuccess(
      res,
      "Your home collection bookings fetched successfully",
      result,
    );
  },
);

// Get completed and cancelled home collection bookings.

export const getMyHomeCollectionHistoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await getMyHomeCollectionHistory(userId);

    return sendSuccess(
      res,
      "Your home collection history fetched successfully",
      result,
    );
  },
);

// Get one home collection booking belonging to the authenticated patient.

export const getMyHomeCollectionByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const homeCollectionId = req.params.homeCollectionId as string;

    if (!homeCollectionId?.trim()) {
      throw new apiError(400, "Home collection ID is required");
    }

    const result = await getMyHomeCollectionById(
      homeCollectionId,
      userId,
    );

    return sendSuccess(
      res,
      "Your home collection booking fetched successfully",
      result,
    );
  },
);
/* -------------------------------------------------------------------------- */
/*                     LAB ACKNOWLEDGEMENT AND ASSIGNMENT                     */
/* -------------------------------------------------------------------------- */

// Lab acknowledges receipt of a booking.
// Lab identity comes exclusively from authenticated request context.

export const acknowledgeHomeCollectionController = asyncHandler(
  async (req: Request, res: Response) => {
    const homeCollectionId = req.params.homeCollectionId as string;
    const labUserId = getUserId(req);

    if (!homeCollectionId?.trim()) {
      throw new apiError(400, "Home collection ID is required");
    }

    const result = await acknowledgeHomeCollectionReceived(
      homeCollectionId,
      labUserId,
    );

    return sendSuccess(
      res,
      "Home collection booking acknowledged; five-minute assignment timer started",
      result,
    );
  },
);

// Lab assigns its own collector.

export const assignLabCollectorController = asyncHandler(
  async (req: Request, res: Response) => {
    const homeCollectionId = req.params.homeCollectionId as string;
    const labUserId = getUserId(req);

    const { collectorId } = req.body;

    if (!homeCollectionId?.trim()) {
      throw new apiError(400, "Home collection ID is required");
    }

    if (
      typeof collectorId !== "string" ||
      !collectorId.trim()
    ) {
      throw new apiError(400, "Valid collectorId is required");
    }

    const result = await assignLabCollectorToHomeCollection(
      homeCollectionId,
      collectorId.trim(),
      labUserId,
    );

    return sendSuccess(
      res,
      "Lab collector assigned successfully",
      result,
      201,
    );
  },
);

// Backward-compatible exports for older router imports.

export const acknowledgeHomeCollectionReceivedController =
  acknowledgeHomeCollectionController;

export const assignLabCollectorToHomeCollectionController =
  assignLabCollectorController;

/* -------------------------------------------------------------------------- */
/*                            HOME COLLECTION GET                             */
/* -------------------------------------------------------------------------- */

export const getHomeCollectionByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const homeCollectionId = req.params.homeCollectionId as string;

    const result = await getHomeCollectionById(homeCollectionId);

    return sendSuccess(
      res,
      "Home collection fetched successfully",
      result,
    );
  },
);

export const getHomeCollectionByAppointmentIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const appointmentId = req.params.appointmentId as string;

    const result = await getHomeCollectionByAppointmentId(appointmentId);

    return sendSuccess(
      res,
      "Home collection fetched successfully",
      result,
    );
  },
);

export const updateHomeCollectionController = asyncHandler(
  async (req: Request, res: Response) => {
    const homeCollectionId = req.params.homeCollectionId as string;

    // IMPORTANT:
    // The service must independently enforce an allowlist of editable fields.
    // Do not allow generic updates to bypass lab acknowledgement,
    // assignment ownership, or the five-minute deadline.

    const result = await updateHomeCollection(
      homeCollectionId,
      req.body,
    );

    return sendSuccess(
      res,
      "Home collection updated successfully",
      result,
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                            HOME COLLECTION SUMMARY                         */
/* -------------------------------------------------------------------------- */

export const getHomeCollectionSummaryController = asyncHandler(
  async (req: Request, res: Response) => {
    const labUserId = getUserId(req);

    const result = await getHomeCollectionSummary(labUserId);

    return sendSuccess(
      res,
      "Home collection summary fetched successfully",
      result,
    );
  },
);

export const getHomeCollectionHistoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const homeCollectionId = req.params.homeCollectionId as string;
    const labUserId = getUserId(req);

    const result = await getHomeCollectionHistory(
      homeCollectionId,
      labUserId,
    );

    return sendSuccess(
      res,
      "Home collection history fetched successfully",
      result,
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                                  COLLECTOR                                 */
/* -------------------------------------------------------------------------- */

export const createCollectorController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await createCollector({
      ...req.body,
      userId,
    });

    return sendSuccess(
      res,
      "Collector created successfully",
      result,
      201,
    );
  },
);

export const getCollectorsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getCollectors();

    return sendSuccess(
      res,
      "Collectors fetched successfully",
      result,
    );
  },
);

export const getCollectorsByLabController = asyncHandler(
  async (req: Request, res: Response) => {
    const labId = req.params.labId as string;

    const result = await getCollectorsByLab(labId);

    return sendSuccess(
      res,
      "Lab collectors fetched successfully",
      result,
    );
  },
);

export const getCollectorByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const collectorId = req.params.collectorId as string;

    const result = await getCollectorById(collectorId);

    return sendSuccess(
      res,
      "Collector fetched successfully",
      result,
    );
  },
);

export const updateCollectorController = asyncHandler(
  async (req: Request, res: Response) => {
    const collectorId = req.params.collectorId as string;

    const result = await updateCollector(
      collectorId,
      req.body,
    );

    return sendSuccess(
      res,
      "Collector updated successfully",
      result,
    );
  },
);

export const deleteCollectorController = asyncHandler(
  async (req: Request, res: Response) => {
    const collectorId = req.params.collectorId as string;

    const result = await removeCollector(collectorId);

    return sendSuccess(
      res,
      "Collector deleted successfully",
      result,
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                           COLLECTOR PROFILE                                */
/* -------------------------------------------------------------------------- */

export const getMyCollectorProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await getMyCollectorProfile(userId);

    return sendSuccess(
      res,
      "Collector profile fetched successfully",
      result,
    );
  },
);

export const updateMyCollectorLocationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const { latitude, longitude, isAvailable } = req.body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      throw new apiError(
        400,
        "Latitude and longitude must be numbers",
      );
    }

    if (
      isAvailable !== undefined &&
      typeof isAvailable !== "boolean"
    ) {
      throw new apiError(
        400,
        "isAvailable must be a boolean",
      );
    }

    const result = await updateMyCollectorLocation(
      userId,
      latitude,
      longitude,
      isAvailable,
    );

    return sendSuccess(
      res,
      "Collector location updated successfully",
      result,
    );
  },
);

export const getMyCollectorDashboardController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await getMyCollectorDashboard(userId);

    return sendSuccess(
      res,
      "Collector dashboard fetched successfully",
      result,
    );
  },
);

export const getMyCollectorHistoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await getMyCollectorHistory(userId);

    return sendSuccess(
      res,
      "Collector history fetched successfully",
      result,
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                          COLLECTOR BOOKING OFFERS                          */
/* -------------------------------------------------------------------------- */

export const getMyCollectorBookingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await getMyCollectorBookings(userId);

    return sendSuccess(
      res,
      "Collector bookings fetched successfully",
      result,
    );
  },
);

export const getMyCollectorBookingOffersController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result = await getMyCollectorBookingOffers(userId);

    return sendSuccess(
      res,
      "Collector booking offers fetched successfully",
      result,
    );
  },
);

export const acceptMyCollectorBookingOfferController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const offerId = req.params.offerId as string;

    const result = await acceptMyCollectorBookingOffer(
      offerId,
      userId,
    );

    return sendSuccess(
      res,
      "Booking offer accepted successfully",
      result,
    );
  },
);

export const rejectMyCollectorBookingOfferController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const offerId = req.params.offerId as string;

    const result = await rejectMyCollectorBookingOffer(
      offerId,
      userId,
    );

    return sendSuccess(
      res,
      "Booking offer rejected successfully",
      result,
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                            COLLECTOR ASSIGNMENT                            */
/* -------------------------------------------------------------------------- */

export const getCollectorAssignmentsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getCollectorAssignments();

    return sendSuccess(
      res,
      "Collector assignments fetched successfully",
      result,
    );
  },
);

export const getCollectorAssignmentByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const collectorAssignmentId =
      req.params.collectorAssignmentId as string;

    const result = await getCollectorAssignmentById(
      collectorAssignmentId,
    );

    return sendSuccess(
      res,
      "Collector assignment fetched successfully",
      result,
    );
  },
);

export const updateCollectorAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const collectorAssignmentId =
      req.params.collectorAssignmentId as string;

    const result = await updateCollectorAssignment(
      collectorAssignmentId,
      req.body,
    );

    return sendSuccess(
      res,
      "Collector assignment updated successfully",
      result,
    );
  },
);

export const deleteCollectorAssignmentController = asyncHandler(
  async (req: Request, res: Response) => {
    const collectorAssignmentId =
      req.params.collectorAssignmentId as string;

    const result = await deleteCollectorAssignment(
      collectorAssignmentId,
    );

    return sendSuccess(
      res,
      "Collector assignment deleted successfully",
      result,
    );
  },
);

/* -------------------------------------------------------------------------- */
/*                         HOME COLLECTION TRACKING                           */
/* -------------------------------------------------------------------------- */

export const createHomeCollectionTrackingController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await createHomeCollectionTracking(req.body);

    return sendSuccess(
      res,
      "Tracking event created successfully",
      result,
      201,
    );
  },
);

export const getHomeCollectionTrackingController = asyncHandler(
  async (req: Request, res: Response) => {
    const homeCollectionId = req.params.homeCollectionId as string;

    const result = await getHomeCollectionTracking(
      homeCollectionId,
    );

    return sendSuccess(
      res,
      "Home collection tracking fetched successfully",
      result,
    );
  },
);

export const getHomeCollectionTrackingByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const trackingId = req.params.trackingId as string;

    const result = await getHomeCollectionTrackingById(
      trackingId,
    );

    return sendSuccess(
      res,
      "Tracking event fetched successfully",
      result,
    );
  },
);


export const pushHomeCollectionToIndependentPoolController = asyncHandler(
  async (req: Request, res: Response) => {
    const homeCollectionId = req.params.homeCollectionId as string;
    const labUserId = getUserId(req);

    if (!homeCollectionId?.trim()) {
      throw new apiError(400, "Home collection ID is required");
    }

    const result = await pushHomeCollectionToIndependentPool(
      homeCollectionId,
      labUserId,
    );

    return sendSuccess(
      res,
      "Home collection pushed into independent collector pool",
      result,
    );
  },
);

