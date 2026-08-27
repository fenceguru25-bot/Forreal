import { NextFunction, Request, Response } from 'express';

import prisma from '../config/database';
import { verifyToken } from '../config/jwt';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const token = header.replace('Bearer ', '').trim();
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        state: true,
        accountTier: true,
        emailVerified: true,
        isSelfExcluded: true,
        selfExcludedUntil: true,
        depositLimit: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
