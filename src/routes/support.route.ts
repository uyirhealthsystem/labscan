import { Router } from "express";

import {
  createSupportTicketController,
  getSupportTicketsController,
} from "../controllers/support.controller";

const router = Router();

router.post(
  "/support/ticket",
  createSupportTicketController,
);

router.get(
  "/support/tickets",
  getSupportTicketsController,
);

export default router;