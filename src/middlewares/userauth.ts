
import { timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { apiError } from "../utils/apiError";
import { logger } from "../utils/logger";

const gatewaySecret = env.gatewaySecret ? Buffer.from(env.gatewaySecret) : null;
if (!gatewaySecret) {
  logger.warn(
    "GATEWAY_SECRET is not set: x-user-id / x-user-role are trusted from any caller. " +
      "Set it (same value as LABSCAN_GATEWAY_SECRET on the api-gateway) on any reachable instance.",
  );
}

// The api-gateway verifies the login, strips any x-user-* / x-gateway-secret the client sent,
// and adds its own. With GATEWAY_SECRET set, only requests carrying the gateway's secret are
// believed: someone calling this service directly can't pretend to be another user.
function fromGateway(req: Request): boolean {
  if (!gatewaySecret) return true;
  const given = req.header("x-gateway-secret");
  if (!given) return false;
  const buf = Buffer.from(given);
  return buf.length === gatewaySecret.length && timingSafeEqual(buf, gatewaySecret);
}

export function userAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    if (!fromGateway(req)) {
      throw new apiError(401, "Requests must come through the Uyir api-gateway");
    }

    const userId = req.header("x-user-id")?.trim();
    const role = req.header("x-user-role")?.trim().toUpperCase();

    if (!userId || !role) {
      throw new apiError(
        401,
        "Authentication required: user identity and role are missing",
      );
    }

    req.user = {
      userId,
      role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Report files (uploads/reports) are patient data: staff roles only. Patients download their own
// files through GET /patient/reports/:reportId/files/:reportFileId, which checks ownership.
export function staffOnly(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role === "PATIENT") {
    next(new apiError(403, "Patients download reports through /patient/reports/:reportId/files/:reportFileId"));
    return;
  }
  next();
}
