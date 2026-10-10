
import { Request, Response } from "express";

import {
  createCollector,
  createCollectorAssignment,
  createHomeCollection,
  createHomeCollectionTracking,
  deleteCollector,
  deleteCollectorAssignment,
  getCollectorAssignmentById,
  getCollectorAssignments,
  getCollectorById,
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
  acceptMyCollectorAssignment,
  rejectMyCollectorAssignment,
  getHomeCollectionSummary,
  getHomeCollectionHistory,
} from "../services/homecollection.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// HOME COLLECTION
// =========================================================

export async function createHomeCollectionController(
  req: Request,
  res: Response,
) {
  try {
    const {
      appointmentId,
      address,
      specialInstructions,
      status,
    } = req.body;

    if (!appointmentId || !address) {
      return res.status(400).json({
        status: "error",
        message: "appointmentId and address are required",
      });
    }

    const homeCollection = await createHomeCollection({
      appointmentId,
      address,
      specialInstructions,
      status,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Home collection created successfully",
      data: await translateResponse(homeCollection, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create home collection",
    });
  }
}

export async function getHomeCollectionsController(
  req: Request,
  res: Response,
) {
  try {
    const homeCollections = await getHomeCollections();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(homeCollections, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch home collections",
    });
  }
}

export async function getHomeCollectionByAppointmentIdController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;

    const homeCollection = await getHomeCollectionByAppointmentId(
      appointmentId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(homeCollection, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Home collection not found",
    });
  }
}

export async function getHomeCollectionByIdController(
  req: Request<{ homeCollectionId: string }>,
  res: Response,
) {
  try {
    const { homeCollectionId } = req.params;

    const homeCollection = await getHomeCollectionById(
      homeCollectionId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(homeCollection, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Home collection not found",
    });
  }
}

export async function updateHomeCollectionController(
  req: Request<{ homeCollectionId: string }>,
  res: Response,
) {
  try {
    const { homeCollectionId } = req.params;

    const homeCollection = await updateHomeCollection(
      homeCollectionId,
      req.body,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Home collection updated successfully",
      data: await translateResponse(homeCollection, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update home collection",
    });
  }
}

// =========================================================
// COLLECTOR
// =========================================================

export async function createCollectorController(
  req: Request,
  res: Response,
) {
  try {
    const {
      labId,
      name,
      phone,
      role,
      qualification,
      qualificationNumber,
      qualificationProofUrl,
      qualificationStatus,
      status,
    } = req.body;

    if (!labId || !name) {
      return res.status(400).json({
        status: "error",
        message: "labId and name are required",
      });
    }

    const collector = await createCollector({
      labId,
      name,
      phone,
      role,
      qualification,
      qualificationNumber,
      qualificationProofUrl,
      qualificationStatus,
      status,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Collector created successfully",
      data: await translateResponse(collector, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create collector",
    });
  }
}

export async function getCollectorsController(
  req: Request,
  res: Response,
) {
  try {
    const collectors = await getCollectors();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(collectors, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch collectors",
    });
  }
}

export async function getCollectorsByLabController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;
    const collectors = await getCollectorsByLab(labId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(collectors, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch lab collectors",
    });
  }
}

export async function getCollectorByIdController(
  req: Request<{ collectorId: string }>,
  res: Response,
) {
  try {
    const { collectorId } = req.params;
    const collector = await getCollectorById(collectorId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(collector, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Collector not found",
    });
  }
}

export async function updateCollectorController(
  req: Request<{ collectorId: string }>,
  res: Response,
) {
  try {
    const { collectorId } = req.params;
    const collector = await updateCollector(collectorId, req.body);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Collector updated successfully",
      data: await translateResponse(collector, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update collector",
    });
  }
}

export async function deleteCollectorController(
  req: Request<{ collectorId: string }>,
  res: Response,
) {
  try {
    const { collectorId } = req.params;
    await deleteCollector(collectorId);

    return res.status(200).json({
      status: "success",
      message: "Collector deleted successfully",
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete collector",
    });
  }
}

// =========================================================
// COLLECTOR ASSIGNMENT
// =========================================================

export async function createCollectorAssignmentController(
  req: Request,
  res: Response,
) {
  try {
    const { homeCollectionId, collectorId } = req.body;

    if (!homeCollectionId || !collectorId) {
      return res.status(400).json({
        status: "error",
        message: "homeCollectionId and collectorId are required",
      });
    }

    const assignment = await createCollectorAssignment({
      homeCollectionId,
      collectorId,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Collector assigned successfully",
      data: await translateResponse(assignment, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to assign collector",
    });
  }
}

export async function getCollectorAssignmentsController(
  req: Request,
  res: Response,
) {
  try {
    const assignments = await getCollectorAssignments();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(assignments, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch collector assignments",
    });
  }
}

export async function getCollectorAssignmentByIdController(
  req: Request<{ collectorAssignmentId: string }>,
  res: Response,
) {
  try {
    const { collectorAssignmentId } = req.params;

    const assignment = await getCollectorAssignmentById(
      collectorAssignmentId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(assignment, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Collector assignment not found",
    });
  }
}

export async function updateCollectorAssignmentController(
  req: Request<{ collectorAssignmentId: string }>,
  res: Response,
) {
  try {
    const { collectorAssignmentId } = req.params;

    const assignment = await updateCollectorAssignment(
      collectorAssignmentId,
      req.body,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Collector assignment updated successfully",
      data: await translateResponse(assignment, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update collector assignment",
    });
  }
}

export async function deleteCollectorAssignmentController(
  req: Request<{ collectorAssignmentId: string }>,
  res: Response,
) {
  try {
    const { collectorAssignmentId } = req.params;

    await deleteCollectorAssignment(collectorAssignmentId);

    return res.status(200).json({
      status: "success",
      message: "Collector assignment deleted successfully",
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete collector assignment",
    });
  }
}

// =========================================================
// HOME COLLECTION TRACKING
// =========================================================

export async function createHomeCollectionTrackingController(
  req: Request,
  res: Response,
) {
  try {
    const { homeCollectionId, status, notes } = req.body;

    if (!homeCollectionId || !status) {
      return res.status(400).json({
        status: "error",
        message: "homeCollectionId and status are required",
      });
    }

    const tracking = await createHomeCollectionTracking({
      homeCollectionId,
      status,
      notes,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Home collection tracking updated successfully",
      data: await translateResponse(tracking, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create tracking record",
    });
  }
}

export async function getHomeCollectionTrackingController(
  req: Request<{ homeCollectionId: string }>,
  res: Response,
) {
  try {
    const { homeCollectionId } = req.params;

    const tracking = await getHomeCollectionTracking(
      homeCollectionId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(tracking, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch tracking records",
    });
  }
}

export async function getHomeCollectionTrackingByIdController(
  req: Request<{ trackingId: string }>,
  res: Response,
) {
  try {
    const { trackingId } = req.params;

    const tracking = await getHomeCollectionTrackingById(
      trackingId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(tracking, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Tracking record not found",
    });
  }
}

// =========================================================
// MY COLLECTOR BOOKINGS
// =========================================================

export async function getMyCollectorBookingsController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.headers["x-user-id"];

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(401).json({
        status: "error",
        message: "User ID is missing from request headers",
      });
    }

    const result = await getMyCollectorBookings(userId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Collector bookings fetched successfully",
      data: await translateResponse(result, language),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch collector bookings";

    const statusCode =
      message === "Collector not found for this user"
        ? 404
        : message === "Collector account is inactive"
          ? 403
          : 500;

    return res.status(statusCode).json({
      status: "error",
      message,
    });
  }
}

// =========================================================
// ACCEPT MY COLLECTOR ASSIGNMENT
// =========================================================

export const acceptMyCollectorAssignmentController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.headers["x-user-id"];

    if (typeof userId !== "string" || !userId) {
      return res.status(401).json({
        status: "error",
        message: "Valid user ID is required",
      });
    }

    const assignmentId = req.params.assignmentId;

    if (typeof assignmentId !== "string" || !assignmentId) {
      return res.status(400).json({
        status: "error",
        message: "Valid assignment ID is required",
      });
    }

    const assignment = await acceptMyCollectorAssignment(
      assignmentId,
      userId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Assignment accepted successfully",
      data: await translateResponse(assignment, language),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const statusCode =
      message === "Collector not found" ||
      message === "Assignment not found"
        ? 404
        : message === "Collector is not active" ||
            message === "Assignment does not belong to this collector"
          ? 403
          : message === "Only assigned bookings can be accepted"
            ? 409
            : 500;

    return res.status(statusCode).json({
      status: "error",
      message,
    });
  }
};

// =========================================================
// REJECT MY COLLECTOR ASSIGNMENT
// =========================================================

export const rejectMyCollectorAssignmentController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.headers["x-user-id"];
    const assignmentId = req.params.assignmentId;

    if (typeof userId !== "string" || !userId) {
      return res.status(401).json({
        status: "error",
        message: "Valid user ID is required",
      });
    }

    if (typeof assignmentId !== "string" || !assignmentId) {
      return res.status(400).json({
        status: "error",
        message: "Valid assignment ID is required",
      });
    }

    const assignment = await rejectMyCollectorAssignment(
      assignmentId,
      userId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Assignment rejected successfully",
      data: await translateResponse(assignment, language),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    const statusCode =
      message === "Collector not found" ||
      message === "Assignment not found"
        ? 404
        : message === "Collector is not active" ||
            message === "Assignment does not belong to this collector"
          ? 403
          : message === "This assignment cannot be rejected"
            ? 409
            : 500;

    return res.status(statusCode).json({
      status: "error",
      message,
    });
  }
};

// =========================================================
// HOME COLLECTION SUMMARY
// =========================================================

export async function getHomeCollectionSummaryController(
  req: Request,
  res: Response,
) {
  try {
    const labUserId = req.header("x-user-id");

    if (!labUserId) {
      return res.status(401).json({
        status: "error",
        message: "Missing authenticated user",
      });
    }

    const summary = await getHomeCollectionSummary(labUserId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(summary, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch home collection summary",
    });
  }
}

// =========================================================
// HOME COLLECTION HISTORY
// =========================================================

export async function getHomeCollectionHistoryController(
  req: Request,
  res: Response,
) {
  try {
    const homeCollectionId = req.params.homeCollectionId as string;
    const labUserId = req.header("x-user-id");

    if (!labUserId) {
      return res.status(401).json({
        status: "error",
        message: "Missing authenticated user",
      });
    }

    if (!homeCollectionId) {
      return res.status(400).json({
        status: "error",
        message: "homeCollectionId is required",
      });
    }

    const history = await getHomeCollectionHistory(
      homeCollectionId,
      labUserId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(history, language),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch history";

    const statusCode =
      message === "Lab not found" ||
      message === "Home collection not found"
        ? 404
        : 500;

    return res.status(statusCode).json({
      status: "error",
      message,
    });
  }
}

