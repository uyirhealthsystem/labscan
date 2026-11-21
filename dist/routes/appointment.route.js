"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointment_controller_1 = require("../controllers/appointment.controller");
const userauth_1 = require("../middlewares/userauth");
const router = (0, express_1.Router)();
// =========================================================
// APPOINTMENT
// =========================================================
router.post("/appointment", userauth_1.userAuth, appointment_controller_1.createAppointmentController);
router.get("/appointments", appointment_controller_1.getAppointmentsController);
router.patch("/appointment/:appointmentId/complete", appointment_controller_1.completeAppointmentController);
router.get("/appointments/lab/:labId", appointment_controller_1.getAppointmentsByLabIdController);
router.get("/appointment/patient/:patientId", appointment_controller_1.getAppointmentsByPatientController);
router.get("/appointment/:appointmentId", appointment_controller_1.getAppointmentByIdController);
router.put("/appointment/:appointmentId", appointment_controller_1.updateAppointmentController);
router.delete("/appointment/:appointmentId", appointment_controller_1.deleteAppointmentController);
// =========================================================
// APPOINTMENT TEST
// =========================================================
router.post("/appointmenttest", appointment_controller_1.createAppointmentTestController);
router.get("/labappointments", appointment_controller_1.getAllAppointmentTestsController);
router.get("/appointmenttest/appointment/:appointmentId", appointment_controller_1.getAppointmentTestsController);
router.get("/appointmenttest/:appointmentTestId", appointment_controller_1.getAppointmentTestByIdController);
router.put("/appointmenttest/:appointmentTestId", appointment_controller_1.updateAppointmentTestController);
router.delete("/appointmenttest/:appointmentTestId", appointment_controller_1.deleteAppointmentTestController);
// =========================================================
// APPOINTMENT SERVICE
// =========================================================
router.post("/appointmentservice", appointment_controller_1.createAppointmentServiceController);
router.get("/scanappointments", appointment_controller_1.getAllAppointmentServicesController);
router.get("/appointmentservice/appointment/:appointmentId", appointment_controller_1.getAppointmentServicesController);
router.get("/appointmentservice/:appointmentServiceId", appointment_controller_1.getAppointmentServiceByIdController);
router.put("/appointmentservice/:appointmentServiceId", appointment_controller_1.updateAppointmentServiceController);
router.delete("/appointmentservice/:appointmentServiceId", appointment_controller_1.deleteAppointmentServiceController);
exports.default = router;
//# sourceMappingURL=appointment.route.js.map