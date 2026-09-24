import { Router } from "express";

import {
  createTimeSlotController,
  getTimeSlotsController,
  getTimeSlotByIdController,
  updateTimeSlotController,
  deleteTimeSlotController,
} from "../controllers/timeslot.controller";

const router = Router();

router.post("/timeslots", createTimeSlotController);

router.get("/timeslots", getTimeSlotsController);

router.get(
  "/timeslots/:timeSlotId",
  getTimeSlotByIdController,
);

router.patch(
  "/timeslots/:timeSlotId",
  updateTimeSlotController,
);

router.delete(
  "/timeslots/:timeSlotId",
  deleteTimeSlotController,
);

export default router;