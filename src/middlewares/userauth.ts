
import { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/apiError";

export function userAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
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
