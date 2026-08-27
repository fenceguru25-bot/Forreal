import { Router } from 'express';

import prisma from '../config/database';
import { adminAuth } from '../middleware/adminAuth';
import { auth } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(createRateLimit({ windowMs: 60_000, max: 30 }), auth, adminAuth);

router.get('/players', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 25), 1), 100);
    const skip = (page - 1) * pageSize;

    const [players, total] = await Promise.all([
      prisma.user.findMany({
        include: { wallet: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count(),
    ]);

    return res.json({
      items: players.map((player) => ({
        id: player.id,
        email: player.email,
        firstName: player.firstName,
        lastName: player.lastName,
        state: player.state,
        accountTier: player.accountTier,
        kycStatus: player.kycStatus,
        emailVerified: player.emailVerified,
        isSelfExcluded: player.isSelfExcluded,
        createdAt: player.createdAt,
        wallet: player.wallet,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch players' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 25), 1), 100);
    const skip = (page - 1) * pageSize;
    const type = typeof req.query.type === 'string' ? req.query.type.toUpperCase() : undefined;
    const currency = typeof req.query.currency === 'string' ? req.query.currency.toUpperCase() : undefined;
    const email = typeof req.query.email === 'string' ? req.query.email : undefined;

    const where = {
      ...(type ? { type } : {}),
      ...(currency ? { currency } : {}),
      ...(email
        ? {
            user: {
              email: {
                contains: email,
                mode: 'insensitive',
              },
            },
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.json({
      items: transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch transactions' });
  }
});

export default router;
