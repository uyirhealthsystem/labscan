import { NextFunction, Request, Response } from 'express';
import { apiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error | apiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const statusCode = err instanceof apiError ? err.statusCode : 500;
  const message = err instanceof apiError ? err.message : 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error({ err }, message);
  } else {
    logger.warn({ err }, message);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
}