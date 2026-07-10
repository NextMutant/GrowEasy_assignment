import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  status?: number;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || null;

  // Log error
  logger.error(`${req.method} ${req.originalUrl} - Status: ${status} - Error: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    logger.debug(err.stack);
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      details,
    },
  });
};

export default errorHandler;
