import { NextFunction, Request, Response } from 'express';
import { apiError } from '../utils/apiError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new apiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}