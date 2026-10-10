
import { Request, Response } from "express";

import {
  createSupportTicket,
  getSupportTickets,
} from "../services/support.service";

import {
  getRequestedLanguage,
  translateResponse,
} from "../utils/translate.response";

export const createSupportTicketController = async (
  req: Request,
  res: Response,
) => {
  try {
    const ticket = await createSupportTicket(req.body);
    const language = getRequestedLanguage(req);

    return res.status(201).json({
      status: "success",
      message: "Support ticket created successfully",
      data: await translateResponse(ticket, language),
    });
  } catch (error: unknown) {
    console.error("Create support ticket error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create support ticket",
    });
  }
};

export const getSupportTicketsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const labId = req.query.labId as string | undefined;

    const scanCenterId =
      req.query.scanCenterId as string | undefined;

    const tickets = await getSupportTickets(
      labId,
      scanCenterId,
    );

    const language = getRequestedLanguage(req);

    return res.status(200).json({
      status: "success",
      data: await translateResponse(tickets, language),
    });
  } catch (error: unknown) {
    console.error("Get support tickets error:", error);

    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to get support tickets",
    });
  }
};

