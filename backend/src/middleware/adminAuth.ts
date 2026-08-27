import { NextFunction, Request, Response } from 'express';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const userEmail = req.user?.email?.toLowerCase();

  if (!adminEmail || !userEmail || adminEmail !== userEmail) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
};
