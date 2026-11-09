
import type { Request, Response } from "express";

import { apiError } from '../utils/apiError';
import { asyncHandler } from "../utils/asyncHandler";

import {
  createCollector,
  createHomeCollection,
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
} from "../services/homecollection.service";

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getUserId(req: Request): string {
  const userId = req.headers["x-user-id"];

  if (!userId || Array.isArray(userId)) {
    throw new apiError(401, "User authentication required");
  }

  return userId;
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
    const result = await createCollector(req.body);

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
/*                            HOME COLLECTION TRACKING                        */
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
