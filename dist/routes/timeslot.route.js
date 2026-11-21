"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timeslot_controller_1 = require("../controllers/timeslot.controller");
const router = (0, express_1.Router)();
router.post("/timeslots", timeslot_controller_1.createTimeSlotController);
router.get("/timeslots", timeslot_controller_1.getTimeSlotsController);
router.get("/timeslots/:timeSlotId", timeslot_controller_1.getTimeSlotByIdController);
router.patch("/timeslots/:timeSlotId", timeslot_controller_1.updateTimeSlotController);
router.delete("/timeslots/:timeSlotId", timeslot_controller_1.deleteTimeSlotController);
exports.default = router;
//# sourceMappingURL=timeslot.route.js.map