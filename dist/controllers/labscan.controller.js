"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabScanByUserIdController = getLabScanByUserIdController;
const labscan_service_1 = require("../services/labscan.service");
const requireuser_1 = require("../utils/requireuser");
const translate_response_1 = require("../utils/translate.response");
// =========================================================
// GET LAB + SCAN DATA FOR LOGGED-IN USER / PRO
// =========================================================
async function getLabScanByUserIdController(req, res) {
    try {
        // Get PRO/User ID from x-user-id header
        const userId = (0, requireuser_1.requireUserId)(req);
        const data = await (0, labscan_service_1.getLabScanByUserId)(userId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(data, language),
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to fetch lab and scan data",
        });
    }
}
//# sourceMappingURL=labscan.controller.js.map