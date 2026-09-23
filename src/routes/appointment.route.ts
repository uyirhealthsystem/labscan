import { Router } from "express";

import {
  createAppointmentController,
  createAppointmentServiceController,
  createAppointmentTestController,
  deleteAppointmentController,
  deleteAppointmentServiceController,
  deleteAppointmentTestController,
  getAppointmentByIdController,
  getAppointmentsByLabIdController,
  getAppointmentServiceByIdController,
  getAppointmentServicesController,
  getAppointmentTestByIdController,
  getAppointmentTestsController,
  getAppointmentsByPatientController,
  getAppointmentsController,
  updateAppointmentController,
  updateAppointmentServiceController,
  updateAppointmentTestController,
  getAllAppointmentTestsController,
  getAllAppointmentServicesController
  
} from "../controllers/appointment.controller";

const router = Router();

// =========================================================
// APPOINTMENT
// =========================================================

router.post(
  "/appointment",
  createAppointmentController,
);

router.get(
  "/appointments",
  getAppointmentsController,
);

router.get( "/appointments/lab/:labId", getAppointmentsByLabIdController, );

router.get(
  "/appointment/patient/:patientId",
  getAppointmentsByPatientController,
);

router.get(
  "/appointment/:appointmentId",
  getAppointmentByIdController,
);

router.put(
  "/appointment/:appointmentId",
  updateAppointmentController,
);

router.delete(
  "/appointment/:appointmentId",
  deleteAppointmentController,
);

// =========================================================
// APPOINTMENT TEST
// =========================================================

router.post(
  "/appointmenttest",
  createAppointmentTestController,
);

router.get(
  "/labappointments",
  getAllAppointmentTestsController,
);

router.get(
  "/appointmenttest/appointment/:appointmentId",
  getAppointmentTestsController,
);



router.get(
  "/appointmenttest/:appointmentTestId",
  getAppointmentTestByIdController,
);

router.put(
  "/appointmenttest/:appointmentTestId",
  updateAppointmentTestController,
);

router.delete(
  "/appointmenttest/:appointmentTestId",
  deleteAppointmentTestController,
);

// =========================================================
// APPOINTMENT SERVICE
// =========================================================

router.post(
  "/appointmentservice",
  createAppointmentServiceController,
);

router.get(
  "/scanappointments",
  getAllAppointmentServicesController,
);

router.get(
  "/appointmentservice/appointment/:appointmentId",
  getAppointmentServicesController,
);

router.get(
  "/appointmentservice/:appointmentServiceId",
  getAppointmentServiceByIdController,
);

router.put(
  "/appointmentservice/:appointmentServiceId",
  updateAppointmentServiceController,
);

router.delete(
  "/appointmentservice/:appointmentServiceId",
  deleteAppointmentServiceController,
);

export default router;