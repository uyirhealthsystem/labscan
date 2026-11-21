"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const providersetting_controller_1 = require("../controllers/providersetting.controller");
const router = (0, express_1.Router)();
router.get("/provider/settings", providersetting_controller_1.getProviderSettingsController);
router.patch("/provider/settings", providersetting_controller_1.updateProviderSettingsController);
exports.default = router;
//# sourceMappingURL=providersetting.route.js.map