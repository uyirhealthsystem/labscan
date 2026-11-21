"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const labscan_controller_1 = require("../controllers/labscan.controller");
const router = (0, express_1.Router)();
// =========================================================
// GET LAB + SCAN DATA FOR LOGGED-IN PRO / USER
// =========================================================
router.get("/user", labscan_controller_1.getLabScanByUserIdController);
exports.default = router;
//# sourceMappingURL=labscan.route.js.map