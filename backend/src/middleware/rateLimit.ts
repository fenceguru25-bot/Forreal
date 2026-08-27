import { NextFunction, Request, Response } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export const createRateLimit = ({ windowMs, max }: RateLimitOptions) => {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip ?? 'unknown'}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};
