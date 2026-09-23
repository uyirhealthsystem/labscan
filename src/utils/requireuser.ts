import { Request } from "express";
import  {apiError}  from "./apiError";

export function requireUserId(req: Request): string {
  const userId = req.header("x-user-id");

  if (!userId) {
    throw new apiError(401, "Unauthenticated (missing x-user-id)");
  }

  return userId;
}