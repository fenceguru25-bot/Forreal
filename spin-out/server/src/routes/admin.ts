import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { GameSessionModel } from '../models/GameSession';
import { UserModel } from '../models/User';
import { creditBalance } from '../services/userService';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/users', async (_req: AuthenticatedRequest, res, next) => {
  try {
    res.json({ success: true, data: await UserModel.getAllUsers() });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_req: AuthenticatedRequest, res, next) => {
  try {
    res.json({ success: true, data: await GameSessionModel.getStats() });
  } catch (error) {
    next(error);
  }
});

router.put('/user/:id/balance', validate(z.object({
  body: z.object({ scAmount: z.number().default(0), gcAmount: z.number().default(0) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
})), async (req, res, next) => {
  try {
    const user = await creditBalance(req.params.id, req.body.scAmount, req.body.gcAmount);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
