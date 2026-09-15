import { Router } from "express";

import {
  createCancellationController,
  createRescheduleController,
  getCancellationByAppointmentIdController,
  getRescheduleByIdController,
  getReschedulesByAppointmentController,
} from "../controllers/appointmentlifecycle.controller";

const router = Router();

// =========================================================
// CANCELLATION
// =========================================================

router.post(
  "/appointment/cancellation",
  createCancellationController,
);

router.get(
  "/appointments/cancellation/:appointmentId",
  getCancellationByAppointmentIdController,
);

// =========================================================
// RESCHEDULE
// =========================================================

router.post(
  "/appointment/reschedule",
  createRescheduleController,
);

router.get(
  "/appointments/rescheduled/:appointmentId",
  getReschedulesByAppointmentController,
);

router.get(
  "/reschedule/:rescheduleId",
  getRescheduleByIdController,
);

export default router;