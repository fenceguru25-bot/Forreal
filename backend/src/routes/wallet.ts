import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import prisma from '../config/database';
import { auth } from '../middleware/auth';
import { geoblock } from '../middleware/geoblock';

const router = Router();
const walletRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

router.use(walletRateLimit, auth, geoblock);

router.get('/balance', async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    return res.json({
      gcBalance: wallet.gcBalance,
      scBalance: wallet.scBalance,
      updatedAt: wallet.updatedAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch wallet balance' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where: { userId: req.user!.id } }),
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
