import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { getDailyLeaderboard, getWeeklyLeaderboard, recordWin } from '../services/leaderboardService';

const router = Router();

router.get('/daily', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getDailyLeaderboard() });
  } catch (error) {
    next(error);
  }
});

router.get('/weekly', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getWeeklyLeaderboard() });
  } catch (error) {
    next(error);
  }
});

router.post('/record-win', validate(z.object({
  body: z.object({ userId: z.string().uuid(), username: z.string().min(2), amount: z.number().positive() }),
  params: z.object({}),
  query: z.object({})
})), async (req, res, next) => {
  try {
    await recordWin(req.body.userId, req.body.username, req.body.amount);
    res.json({ success: true, message: 'Win recorded.' });
  } catch (error) {
    next(error);
  }
});

export default router;
