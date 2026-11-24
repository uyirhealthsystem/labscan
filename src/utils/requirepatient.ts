import type { Request, RequestHandler } from "express";
import { apiError } from "./apiError";

export function requirePatientId(req: Request): string {
  const userId = req.header("x-user-id")?.trim();
  const role = req.header("x-user-role")?.trim().toUpperCase();

  if (!userId || !role) {
    throw new apiError(401, "Authentication required");
  }
  if (role !== "PATIENT") {
    throw new apiError(403, "Patient access required");
  }

  return userId;
}

export const requirePatient: RequestHandler = (req, _res, next) => {
  try {
    requirePatientId(req);
    next();
  } catch (error) {
    next(error);
  }
};
