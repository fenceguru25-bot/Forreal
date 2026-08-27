import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';

import prisma from '../config/database';
import { auth } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit';

const router = Router();
const allowedPeriods = ['30', '60', '90', '180', '365', 'permanent'];

router.use(createRateLimit({ windowMs: 60_000, max: 20 }), auth);

router.post(
  '/self-exclude',
  [
    body('period')
      .isString()
      .custom((value) => allowedPeriods.includes(String(value)))
      .withMessage('Period must be one of 30, 60, 90, 180, 365, or permanent'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const period = String(req.body.period);
      const selfExcludedUntil =
        // Null is treated as a permanent exclusion by login/status checks.
        period === 'permanent'
          ? null
          : new Date(Date.now() + Number(period) * 24 * 60 * 60 * 1000);

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          isSelfExcluded: true,
          selfExcludedUntil,
        },
      });

      return res.json({
        message:
          period === 'permanent'
            ? 'Permanent self-exclusion enabled'
            : `Self-exclusion enabled for ${period} days`,
        status: {
          isSelfExcluded: user.isSelfExcluded,
          selfExcludedUntil: user.selfExcludedUntil,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Unable to update self-exclusion settings' });
    }
  },
);

router.post(
  '/deposit-limit',
  [body('amount').isFloat({ gt: 0 }).withMessage('Deposit limit must be greater than 0')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const depositLimit = Number(req.body.amount);
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { depositLimit },
      });

      return res.json({
        message: 'Daily deposit limit updated',
        depositLimit: user.depositLimit,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Unable to update deposit limit' });
    }
  },
);

router.get('/status', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        isSelfExcluded: true,
        selfExcludedUntil: true,
        depositLimit: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      isSelfExcluded: user.isSelfExcluded,
      selfExcludedUntil: user.selfExcludedUntil,
      depositLimit: user.depositLimit,
      selfExcludedActive:
        user.isSelfExcluded && (!user.selfExcludedUntil || user.selfExcludedUntil > new Date()),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch responsible gaming status' });
  }
});

export default router;
