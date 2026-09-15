import { Router } from "express";

import {
  createPatientController,
  deletePatientController,
  getPatientByIdController,
  getPatientsController,
  updatePatientController,
} from "../controllers/patient.controller";

const router = Router();

router.post(
  "/patient",
  createPatientController,
);

router.get(
  "/patients",
  getPatientsController,
);

router.get(
  "/patient/:patientId",
  getPatientByIdController,
);

router.put(
  "/patient/:patientId",
  updatePatientController,
);

router.delete(
  "/patient/:patientId",
  deletePatientController,
);

export default router;