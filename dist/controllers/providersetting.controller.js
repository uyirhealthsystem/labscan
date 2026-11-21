"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProviderSettingsController = exports.getProviderSettingsController = void 0;
const providersetting_service_1 = require("../services/providersetting.service");
const translate_response_1 = require("../utils/translate.response");
const getProviderSettingsController = async (req, res) => {
    try {
        const labId = req.query.labId;
        const scanCenterId = req.query.scanCenterId;
        const settings = await (0, providersetting_service_1.getProviderSettings)(labId, scanCenterId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(settings, language),
        });
    }
    catch (error) {
        console.error("Get provider settings error:", error);
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to get provider settings",
        });
    }
};
exports.getProviderSettingsController = getProviderSettingsController;
const updateProviderSettingsController = async (req, res) => {
    try {
        const settings = await (0, providersetting_service_1.updateProviderSettings)(req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            message: "Provider settings updated successfully",
            data: await (0, translate_response_1.translateResponse)(settings, language),
        });
    }
    catch (error) {
        console.error("Update provider settings error:", error);
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to update provider settings",
        });
    }
};
exports.updateProviderSettingsController = updateProviderSettingsController;
//# sourceMappingURL=providersetting.controller.js.map