"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const support_controller_1 = require("../controllers/support.controller");
const router = (0, express_1.Router)();
router.post("/support/ticket", support_controller_1.createSupportTicketController);
router.get("/support/tickets", support_controller_1.getSupportTicketsController);
exports.default = router;
//# sourceMappingURL=support.route.js.map