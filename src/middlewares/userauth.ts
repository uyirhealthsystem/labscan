import { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/apiError";

export function userAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.header("x-user-id");

    if (!userId) {
      throw new apiError(
        401,
        "Unauthenticated (missing x-user-id)",
      );
    }

    (req as any).userId = userId;

    next();
  } catch (error) {
    next(error);
  }
}