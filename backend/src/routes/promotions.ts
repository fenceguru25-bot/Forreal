import type { TransactionClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';

import prisma from '../config/database';
import { verifyToken } from '../config/jwt';
import { auth } from '../middleware/auth';
import { geoblock } from '../middleware/geoblock';
import { createRateLimit } from '../middleware/rateLimit';

const router = Router();
const protectedRateLimit = createRateLimit({ windowMs: 60_000, max: 40 });
const amoeRateLimit = createRateLimit({ windowMs: 60_000, max: 10 });

router.get('/', protectedRateLimit, auth, geoblock, async (_req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ items: promotions, total: promotions.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to load promotions' });
  }
});

router.post('/claim/:id', protectedRateLimit, auth, geoblock, async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const promotion = await tx.promotion.findUnique({ where: { id: req.params.id } });
      if (!promotion || !promotion.isActive) {
        throw new Error('Promotion not found or inactive');
      }
      if (promotion.expiresAt && promotion.expiresAt <= new Date()) {
        throw new Error('Promotion has expired');
      }
      if (promotion.maxClaims && promotion.claimCount >= promotion.maxClaims) {
        throw new Error('Promotion claim limit reached');
      }

      const existingClaim = await tx.promotionClaim.findFirst({
        where: { userId: req.user!.id, promotionId: promotion.id },
      });
      if (existingClaim) {
        throw new Error('Promotion already claimed');
      }

      const wallet = await tx.wallet.findUnique({ where: { userId: req.user!.id } });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId: req.user!.id },
        data: {
          gcBalance: { increment: promotion.gcAmount },
          scBalance: { increment: promotion.scAmount },
        },
      });

      await tx.promotionClaim.create({
        data: { userId: req.user!.id, promotionId: promotion.id },
      });

      await tx.promotion.update({
        where: { id: promotion.id },
        data: { claimCount: { increment: 1 } },
      });

      const ledgerEntries = [] as Promise<unknown>[];
      if (promotion.gcAmount > 0) {
        ledgerEntries.push(
          tx.transaction.create({
            data: {
              userId: req.user!.id,
              type: 'BONUS',
              currency: 'GC',
              amount: promotion.gcAmount,
              description: `Promotion claimed: ${promotion.name}`,
            },
          }),
        );
      }
      if (promotion.scAmount > 0) {
        ledgerEntries.push(
          tx.transaction.create({
            data: {
              userId: req.user!.id,
              type: 'BONUS',
              currency: 'SC',
              amount: promotion.scAmount,
              description: `Promotion claimed: ${promotion.name}`,
            },
          }),
        );
      }
      await Promise.all(ledgerEntries);

      return { promotion, wallet: updatedWallet };
    });

    return res.json({
      message: 'Promotion claimed successfully',
      promotion: result.promotion,
      wallet: result.wallet,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Unable to claim promotion',
    });
  }
});

router.post(
  '/amoe',
  amoeRateLimit,
  geoblock,
  [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('address').trim().isLength({ min: 5 }).withMessage('Address is required'),
    body('city').trim().isLength({ min: 2 }).withMessage('City is required'),
    body('state')
      .isLength({ min: 2, max: 2 })
      .withMessage('State must be a valid 2-letter code')
      .customSanitizer((value) => String(value).toUpperCase()),
    body('zip').trim().isPostalCode('US').withMessage('ZIP code must be valid'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const authHeader = req.headers.authorization;
      let authenticatedUserId: string | undefined;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          authenticatedUserId = verifyToken(authHeader.replace('Bearer ', '').trim()).userId;
        } catch {
          authenticatedUserId = undefined;
        }
      }

      const matchedUser = authenticatedUserId
        ? await prisma.user.findUnique({ where: { id: authenticatedUserId }, include: { wallet: true } })
        : await prisma.user.findUnique({ where: { email: req.body.email }, include: { wallet: true } });

      const entry = await prisma.$transaction(async (tx: TransactionClient) => {
        const createdEntry = await tx.amoeEntry.create({
          data: {
            userId: matchedUser?.id,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            processedAt: new Date(),
            scAwarded: 0.5,
          },
        });

        if (matchedUser?.wallet) {
          await tx.wallet.update({
            where: { userId: matchedUser.id },
            data: { scBalance: { increment: 0.5 } },
          });
          await tx.transaction.create({
            data: {
              userId: matchedUser.id,
              type: 'AMOE_AWARD',
              currency: 'SC',
              amount: 0.5,
              description: 'AMOE mail-in entry credit',
            },
          });
        }

        return createdEntry;
      });

      return res.status(201).json({
        message: matchedUser
          ? 'AMOE entry submitted and 0.5 SC credited.'
          : 'AMOE entry submitted. Create or log into your account to receive the 0.5 SC award.',
        entry,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Unable to submit AMOE entry' });
    }
  },
);

export default router;
