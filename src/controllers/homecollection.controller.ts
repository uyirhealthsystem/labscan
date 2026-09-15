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
} from "../services/homecollection.service";

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
        message:
          "appointmentId and address are required",
      });
    }

    const homeCollection =
      await createHomeCollection({
        appointmentId,
        address,
        specialInstructions,
        status,
      });

    return res.status(201).json({
      status: "success",
      message: "Home collection created successfully",
      data: homeCollection,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getHomeCollectionsController(
  req: Request,
  res: Response,
) {
  try {
    const homeCollections =
      await getHomeCollections();

    return res.status(200).json({
      status: "success",
      data: homeCollections,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getHomeCollectionByAppointmentIdController(
  req: Request<{ appointmentId: string }>,
  res: Response,
) {
  try {
    const { appointmentId } = req.params;

    const homeCollection =
      await getHomeCollectionByAppointmentId(
        appointmentId,
      );

    return res.status(200).json({
      status: "success",
      data: homeCollection,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getHomeCollectionByIdController(
  req: Request<{ homeCollectionId: string }>,
  res: Response,
) {
  try {
    const { homeCollectionId } = req.params;

    const homeCollection =
      await getHomeCollectionById(
        homeCollectionId,
      );

    return res.status(200).json({
      status: "success",
      data: homeCollection,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function updateHomeCollectionController(
  req: Request<{ homeCollectionId: string }>,
  res: Response,
) {
  try {
    const { homeCollectionId } = req.params;

    const homeCollection =
      await updateHomeCollection(
        homeCollectionId,
        req.body,
      );

    return res.status(200).json({
      status: "success",
      message: "Home collection updated successfully",
      data: homeCollection,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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
      status,
    });

    return res.status(201).json({
      status: "success",
      message: "Collector created successfully",
      data: collector,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getCollectorsController(
  req: Request,
  res: Response,
) {
  try {
    const collectors = await getCollectors();

    return res.status(200).json({
      status: "success",
      data: collectors,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getCollectorsByLabController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;

    const collectors =
      await getCollectorsByLab(labId);

    return res.status(200).json({
      status: "success",
      data: collectors,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getCollectorByIdController(
  req: Request<{ collectorId: string }>,
  res: Response,
) {
  try {
    const { collectorId } = req.params;

    const collector =
      await getCollectorById(collectorId);

    return res.status(200).json({
      status: "success",
      data: collector,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function updateCollectorController(
  req: Request<{ collectorId: string }>,
  res: Response,
) {
  try {
    const { collectorId } = req.params;

    const collector = await updateCollector(
      collectorId,
      req.body,
    );

    return res.status(200).json({
      status: "success",
      message: "Collector updated successfully",
      data: collector,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
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
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
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
    const {
      homeCollectionId,
      collectorId,
      status,
    } = req.body;

    if (!homeCollectionId || !collectorId) {
      return res.status(400).json({
        status: "error",
        message:
          "homeCollectionId and collectorId are required",
      });
    }

    const assignment =
      await createCollectorAssignment({
        homeCollectionId,
        collectorId,
        status,
      });

    return res.status(201).json({
      status: "success",
      message:
        "Collector assigned successfully",
      data: assignment,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getCollectorAssignmentsController(
  req: Request,
  res: Response,
) {
  try {
    const assignments =
      await getCollectorAssignments();

    return res.status(200).json({
      status: "success",
      data: assignments,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getCollectorAssignmentByIdController(
  req: Request<{ collectorAssignmentId: string }>,
  res: Response,
) {
  try {
    const { collectorAssignmentId } = req.params;

    const assignment =
      await getCollectorAssignmentById(
        collectorAssignmentId,
      );

    return res.status(200).json({
      status: "success",
      data: assignment,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function updateCollectorAssignmentController(
  req: Request<{ collectorAssignmentId: string }>,
  res: Response,
) {
  try {
    const { collectorAssignmentId } = req.params;

    const assignment =
      await updateCollectorAssignment(
        collectorAssignmentId,
        req.body,
      );

    return res.status(200).json({
      status: "success",
      message:
        "Collector assignment updated successfully",
      data: assignment,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function deleteCollectorAssignmentController(
  req: Request<{ collectorAssignmentId: string }>,
  res: Response,
) {
  try {
    const { collectorAssignmentId } = req.params;

    await deleteCollectorAssignment(
      collectorAssignmentId,
    );

    return res.status(200).json({
      status: "success",
      message:
        "Collector assignment deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// TRACKING
// =========================================================

export async function createHomeCollectionTrackingController(
  req: Request,
  res: Response,
) {
  try {
    const {
      homeCollectionId,
      status,
      notes,
    } = req.body;

    if (!homeCollectionId || !status) {
      return res.status(400).json({
        status: "error",
        message:
          "homeCollectionId and status are required",
      });
    }

    const tracking =
      await createHomeCollectionTracking({
        homeCollectionId,
        status,
        notes,
      });

    return res.status(201).json({
      status: "success",
      message:
        "Home collection tracking updated successfully",
      data: tracking,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getHomeCollectionTrackingController(
  req: Request<{ homeCollectionId: string }>,
  res: Response,
) {
  try {
    const { homeCollectionId } = req.params;

    const tracking =
      await getHomeCollectionTracking(
        homeCollectionId,
      );

    return res.status(200).json({
      status: "success",
      data: tracking,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getHomeCollectionTrackingByIdController(
  req: Request<{ trackingId: string }>,
  res: Response,
) {
  try {
    const { trackingId } = req.params;

    const tracking =
      await getHomeCollectionTrackingById(
        trackingId,
      );

    return res.status(200).json({
      status: "success",
      data: tracking,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}