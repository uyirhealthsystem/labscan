import { Request, Response } from "express";

import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatients,
  updatePatient,
} from "../services/patient.service";

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

    return res.status(201).json({
      status: "success",
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getPatientsController(
  req: Request,
  res: Response,
) {
  try {
    const patients = await getPatients();

    return res.status(200).json({
      status: "success",
      data: patients,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export async function getPatientByIdController(
  req: Request<{ patientId: string }>,
  res: Response,
) {
  try {
    const { patientId } = req.params;

    const patient = await getPatientById(patientId);

    return res.status(200).json({
      status: "success",
      data: patient,
    });
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}

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

    return res.status(200).json({
      status: "success",
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

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
  } catch (error: any) {
    return res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
}