import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'Route not found.' });
};

export const errorHandler = (error: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = error.statusCode ?? 500;
  const message = error.message || 'Internal server error.';

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(statusCode).json({ success: false, error: message });
};
