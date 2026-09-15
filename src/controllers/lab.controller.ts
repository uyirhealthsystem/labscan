import { Request, Response } from "express";

import {
  createLab,
  deleteLab,
  getLabById,
  getLabs,
  updateLab,
} from "../services/lab.service";

// =========================================================
// CREATE LAB
// =========================================================

export async function createLabController(
  req: Request,
  res: Response,
) {
  try {
    const {
      labUserId,
      name,
      registrationNumber,
      phone,
      email,
      address,
      districtId,
      status,
    } = req.body;

    if (!labUserId || !name) {
      return res.status(400).json({
        status: "error",
        message: "labUserId and name are required",
      });
    }

    const lab = await createLab({
      labUserId,
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

export async function deleteLabController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;

    await deleteLab(labId);

    return res.status(200).json({
      status: "success",
      message: "Lab deleted successfully",
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}