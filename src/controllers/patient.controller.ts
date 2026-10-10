
import { Request, Response } from "express";

import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatients,
  updatePatient,
} from "../services/patient.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

// =========================================================
// CREATE PATIENT
// =========================================================

export async function createPatientController(
  req: Request,
  res: Response,
) {
  try {
    const {
      name,
      gender,
      age,
      phone,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "name is required",
      });
    }

    const patient = await createPatient({
      name,
      gender,
      age,
      phone,
    });

    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Patient created successfully",
      data: await translateResponse(patient, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create patient",
    });
  }
}

// =========================================================
// GET ALL PATIENTS
// =========================================================

export async function getPatientsController(
  req: Request,
  res: Response,
) {
  try {
    const patients = await getPatients();
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(patients, language),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch patients",
    });
  }
}

// =========================================================
// GET PATIENT BY ID
// =========================================================

export async function getPatientByIdController(
  req: Request<{ patientId: string }>,
  res: Response,
) {
  try {
    const { patientId } = req.params;

    const patient = await getPatientById(patientId);
    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(patient, language),
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Patient not found",
    });
  }
}

// =========================================================
// UPDATE PATIENT
// =========================================================

export async function updatePatientController(
  req: Request<{ patientId: string }>,
  res: Response,
) {
  try {
    const { patientId } = req.params;

    const patient = await updatePatient(
      patientId,
      req.body,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      message: "Patient updated successfully",
      data: await translateResponse(patient, language),
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to update patient",
    });
  }
}

// =========================================================
// DELETE PATIENT
// =========================================================

export async function deletePatientController(
  req: Request<{ patientId: string }>,
  res: Response,
) {
  try {
    const { patientId } = req.params;

    await deletePatient(patientId);

    return res.status(200).json({
      status: "success",
      message: "Patient deleted successfully",
    });
  } catch (error: unknown) {
    return res.status(404).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete patient",
    });
  }
}

