"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportTicketsController = exports.createSupportTicketController = void 0;
const support_service_1 = require("../services/support.service");
const translate_response_1 = require("../utils/translate.response");
const createSupportTicketController = async (req, res) => {
    try {
        const ticket = await (0, support_service_1.createSupportTicket)(req.body);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(201).json({
            status: "success",
            message: "Support ticket created successfully",
            data: await (0, translate_response_1.translateResponse)(ticket, language),
        });
    }
    catch (error) {
        console.error("Create support ticket error:", error);
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to create support ticket",
        });
    }
};
exports.createSupportTicketController = createSupportTicketController;
const getSupportTicketsController = async (req, res) => {
    try {
        const labId = req.query.labId;
        const scanCenterId = req.query.scanCenterId;
        const tickets = await (0, support_service_1.getSupportTickets)(labId, scanCenterId);
        const language = (0, translate_response_1.getRequestedLanguage)(req);
        return res.status(200).json({
            status: "success",
            data: await (0, translate_response_1.translateResponse)(tickets, language),
        });
    }
    catch (error) {
        console.error("Get support tickets error:", error);
        return res.status(400).json({
            status: "error",
            message: error instanceof Error
                ? error.message
                : "Failed to get support tickets",
        });
    }
};
exports.getSupportTicketsController = getSupportTicketsController;
//# sourceMappingURL=support.controller.js.map