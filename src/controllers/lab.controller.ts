
import { Request, Response } from "express";

import {
  createLab,
  deleteLab,
  getLabById,
  getLabs,
  getLabsByDistrict,
  updateLab,
  getLabsByUserId
} from "../services/lab.service";

import { requireUserId } from "../utils/requireuser";

// =========================================================
// CREATE LAB
// =========================================================

export async function createLabController(
  req: Request,
  res: Response,
) {
  try {
    // Get labUserId from x-user-id header
    const userId = requireUserId(req);

    const {
      name,
      registrationNumber,
      phone,
      email,
      address,
      districtId,
      status,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "name is required",
      });
    }

    const lab = await createLab({
      labUserId: userId,
      name,
      registrationNumber,
      phone,
      email,
      address,
      districtId,
      status,
    });

    return res.status(201).json({
      status: "success",
      message: "Lab created successfully",
      data: lab,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// GET ALL LABS
// =========================================================

export async function getLabsController(
  req: Request,
  res: Response,
) {
  try {
    const labs = await getLabs();

    return res.status(200).json({
      status: "success",
      data: labs,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getLabsByDistrictController(
  req: Request,
  res: Response,
): Promise<void> {
  const districtId = req.params.districtId as string;

  if (!districtId) {
    res.status(400).json({
      status: "error",
      message: "districtId is required",
    });
    return;
  }

  const labs = await getLabsByDistrict(districtId);

  res.status(200).json({
    status: "success",
    districtId,
    data: labs,
  });
}

// =========================================================
// GET LAB BY ID
// =========================================================

export async function getLabByIdController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;

    const lab = await getLabById(labId);

    return res.status(200).json({
      status: "success",
      data: lab,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// UPDATE LAB
// =========================================================

export async function updateLabController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;

    const lab = await updateLab(
      labId,
      req.body,
    );

    return res.status(200).json({
      status: "success",
      message: "Lab updated successfully",
      data: lab,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

// =========================================================
// DELETE LAB
// =========================================================

// =========================================================
// DELETE LAB - SOFT DELETE
// =========================================================

export async function deleteLabController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;

    const lab = await deleteLab(labId);

    return res.status(200).json({
      status: "success",
      message: "Lab deactivated successfully",
      data: {
        labId: lab.labId,
        name: lab.name,
        status: lab.status,
      },
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}


// =========================================================
// GET LABS BY USER ID
// =========================================================

export async function getLabsByUserIdController(
  req: Request,
  res: Response,
) {
  try {
    const userId = requireUserId(req);

    const labs = await getLabsByUserId(userId);

    return res.status(200).json({
      status: "success",
      data: labs,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

