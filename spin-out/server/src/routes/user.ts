import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { GameSessionModel } from '../models/GameSession';
import { UserModel } from '../models/User';
import { getUserTransactions } from '../services/transactionService';
import { claimDailyBonus } from '../services/userService';

const router = Router();
router.use(requireAuth);

router.get('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }
    const history = await GameSessionModel.findByUserId(user.id, 1, 10);
    res.json({ success: true, data: { user, history } });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', validate(z.object({
  body: z.object({
    username: z.string().min(3).max(30).optional(),
    avatar: z.union([z.string().url(), z.literal('')]).optional()
  }),
  params: z.object({}),
  query: z.object({})
})), async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await UserModel.updateProfile(req.user!.userId, {
      username: req.body.username,
      avatarUrl: req.body.avatar || null
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const transactions = await getUserTransactions(req.user!.userId, page, limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
});

router.post('/daily-bonus', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await claimDailyBonus(req.user!.userId);
    res.json({ success: true, data: user, message: 'Daily sweeps coin awarded.' });
  } catch (error) {
    next(error);
  }
});

router.post('/self-exclude', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await UserModel.setSelfExcluded(req.user!.userId, true);
    res.json({ success: true, data: user, message: 'Self-exclusion activated.' });
  } catch (error) {
    next(error);
  }
});

export default router;
