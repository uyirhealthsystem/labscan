"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentlifecycle_controller_1 = require("../controllers/appointmentlifecycle.controller");
const router = (0, express_1.Router)();
// =========================================================
// CANCELLATION
// =========================================================
router.post("/appointment/cancellation", appointmentlifecycle_controller_1.createCancellationController);
router.get("/appointments/cancellation/:appointmentId", appointmentlifecycle_controller_1.getCancellationByAppointmentIdController);
// =========================================================
// RESCHEDULE
// =========================================================
router.post("/appointment/reschedule", appointmentlifecycle_controller_1.createRescheduleController);
router.get("/appointments/rescheduled/:appointmentId", appointmentlifecycle_controller_1.getReschedulesByAppointmentController);
router.get("/reschedule/:rescheduleId", appointmentlifecycle_controller_1.getRescheduleByIdController);
exports.default = router;
//# sourceMappingURL=appointmentlifecycle.route.js.map