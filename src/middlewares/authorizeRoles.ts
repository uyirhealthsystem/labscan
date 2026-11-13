
import { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/apiError";

export function authorizeRoles(...allowedRoles: string[]) {
  const normalizedRoles = allowedRoles.map((role) =>
    role.trim().toUpperCase(),
  );

  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      if (!req.user) {
        throw new apiError(401, "Authentication required");
      }

      if (!normalizedRoles.includes(req.user.role)) {
        throw new apiError(
          403,
          "You do not have permission to access this resource",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
