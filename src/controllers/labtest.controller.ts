import { Request, Response } from "express";
import {
  createLabTest,
  deleteLabTest,
  getLabTestById,
  getLabTests,
  updateLabTest,
} from "../services/labtest.service";


// =========================================================
// CREATE LAB TEST
// =========================================================

export async function createLabTestController(
  req: Request,
  res: Response,
) {
  try {
    const {
      labId,
      testCatalogId,
      price,
      turnaroundTime,
      status,
    } = req.body;

    // Required field validation
    if (!labId) {
      return res.status(400).json({
        status: "error",
        message: "labId is required",
      });
    }

    if (!testCatalogId) {
      return res.status(400).json({
        status: "error",
        message: "testCatalogId is required",
      });
    }

    const labTest = await createLabTest({
      labId,
      testCatalogId,
      price,
      turnaroundTime,
      status,
    });

    return res.status(201).json({
      status: "success",
      data: labTest,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create lab test",
    });
  }
}


// =========================================================
// GET ALL LAB TESTS
// =========================================================

export async function getLabTestsController(
  req: Request<{ labId: string }>,
  res: Response,
) {
  try {
    const { labId } = req.params;

    const labTests = await getLabTests(labId);

    return res.status(200).json({
      status: "success",
      data: labTests,
    });
  } catch (error) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch lab tests",
    });
  }
}


// =========================================================
// GET SINGLE LAB TEST
// =========================================================

export async function getLabTestByIdController(
  req: Request<{
    labId: string;
    labTestId: string;
  }>,
  res: Response,
) {
  try {
    const {
      labId,
      labTestId,
    } = req.params;

    const labTest = await getLabTestById(
      labId,
      labTestId,
    );

    return res.status(200).json({
      status: "success",
      data: labTest,
    });
  } catch (error) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Lab test not found",
    });
  }
}


// =========================================================
// UPDATE LAB TEST
// =========================================================

export async function updateLabTestController(
  req: Request<{
    labId: string;
    labTestId: string;
  }>,
  res: Response,
) {
  try {
    const {
      labId,
      labTestId,
    } = req.params;

    const {
      price,
      turnaroundTime,
      status,
    } = req.body;

    const labTest = await updateLabTest(
      labId,
      labTestId,
      {
        price,
        turnaroundTime,
        status,
      },
    );

    return res.status(200).json({
      status: "success",
      data: labTest,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update lab test",
    });
  }
}


// =========================================================
// DELETE LAB TEST
// =========================================================

export async function deleteLabTestController(
  req: Request<{
    labId: string;
    labTestId: string;
  }>,
  res: Response,
) {
  try {
    const {
      labId,
      labTestId,
    } = req.params;

    const labTest = await deleteLabTest(
      labId,
      labTestId,
    );

    return res.status(200).json({
      status: "success",
      data: labTest,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete lab test",
    });
  }
}