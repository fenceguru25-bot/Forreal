import { Router } from 'express';
import { z } from 'zod';
import { CASHAPP_CASHTAG, COIN_PACKAGES } from '../../../shared/src/constants';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPaymentRequest, processPayment, verifyWebhookSignature } from '../services/cashappService';

const router = Router();

router.get('/packages', (_req, res) => {
  res.json({ success: true, data: { packages: COIN_PACKAGES, cashtag: CASHAPP_CASHTAG } });
});

router.post('/create-payment', requireAuth, validate(z.object({
  body: z.object({ packageId: z.string(), amount: z.number().positive() }),
  params: z.object({}),
  query: z.object({})
})), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { packageId, amount } = req.body;
    const payment = createPaymentRequest(req.user!.userId, packageId, amount);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', validate(z.object({
  body: z.object({ userId: z.string().uuid(), packageId: z.string() }),
  params: z.object({}),
  query: z.object({})
})), async (req, res, next) => {
  try {
    const signature = String(req.headers['x-cashapp-signature'] ?? '');
    const secret = process.env.CASHAPP_WEBHOOK_SECRET ?? '';
    const payload = req.rawBody ?? JSON.stringify(req.body);
    if (!signature || !verifyWebhookSignature(payload, signature, secret)) {
      res.status(401).json({ success: false, error: 'Invalid webhook signature.' });
      return;
    }
    const user = await processPayment(req.body.userId, req.body.packageId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
