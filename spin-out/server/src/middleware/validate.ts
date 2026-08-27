import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction): void => {
  const parsed = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(', ')
    });
    return;
  }

  req.body = parsed.data.body;
  req.query = parsed.data.query;
  req.params = parsed.data.params;
  next();
};
