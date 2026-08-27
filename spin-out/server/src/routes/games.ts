import { Router } from 'express';
import { z } from 'zod';
import { MAX_BET, MIN_BET } from '../../../shared/src/constants';
import { redis } from '../db/redis';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { gameLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { GameSessionModel } from '../models/GameSession';
import { UserModel } from '../models/User';
import { calculatePayout as calculateBaccaratPayout, deal as dealBaccarat } from '../services/baccaratEngine';
import { calculatePayout as calculateBlackjackPayout, double, hit, stand, startGame } from '../services/blackjackEngine';
import { recordWin } from '../services/leaderboardService';
import { spin as spinRoulette, type RouletteBet } from '../services/rouletteEngine';
import { generateServerSeed, spin as spinSlots } from '../services/slotEngine';
import { recordTransaction } from '../services/transactionService';
import { creditBalance, debitBalance } from '../services/userService';

const router = Router();
router.use(requireAuth, gameLimiter);
const betSchema = z.number().min(MIN_BET).max(MAX_BET);

router.post('/slots/spin', validate(z.object({
  body: z.object({
    bet: betSchema,
    currency: z.enum(['SC', 'GC']),
    clientSeed: z.string().min(3),
    nonce: z.number().int().nonnegative().default(0)
  }),
  params: z.object({}),
  query: z.object({})
})), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { bet, currency, clientSeed, nonce } = req.body;
    const user = await UserModel.findById(req.user!.userId);
    if (!user || user.selfExcluded) {
      res.status(403).json({ success: false, error: 'Unable to play games on this account.' });
      return;
    }
    await debitBalance(user.id, currency === 'SC' ? -bet : 0, currency === 'GC' ? -bet : 0);
    const serverSeed = generateServerSeed();
    const result = spinSlots(bet, currency, serverSeed, clientSeed, nonce);
    if (result.winAmount > 0) {
      await creditBalance(user.id, currency === 'SC' ? result.winAmount : 0, currency === 'GC' ? result.winAmount : 0);
      await recordWin(user.id, user.username, result.winAmount);
    }
    await recordTransaction(user.id, result.winAmount > 0 ? 'win' : 'loss', result.winAmount > 0 ? result.winAmount : bet, currency, {
      game: 'slots', clientSeed, nonce, paylines: result.paylines
    });
    const session = await GameSessionModel.create({
      userId: user.id,
      gameType: 'slot',
      betAmount: bet,
      currency,
      outcome: result.winAmount > 0 ? 'win' : 'loss',
      winAmount: result.winAmount,
      provableSeed: serverSeed,
      metadata: result
    });
    res.json({ success: true, data: { result, session } });
  } catch (error) {
    next(error);
  }
});

router.post('/blackjack/start', validate(z.object({
  body: z.object({ bet: betSchema, currency: z.enum(['SC', 'GC']) }),
  params: z.object({}),
  query: z.object({})
})), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { bet, currency } = req.body;
    const user = await UserModel.findById(req.user!.userId);
    if (!user || user.selfExcluded) {
      res.status(403).json({ success: false, error: 'Unable to play games on this account.' });
      return;
    }
    await debitBalance(user.id, currency === 'SC' ? -bet : 0, currency === 'GC' ? -bet : 0);
    const game = startGame(bet);
    await redis.set(`blackjack:${user.id}`, JSON.stringify({ ...game, currency }), 'EX', 60 * 30);
    res.json({ success: true, data: game.state });
  } catch (error) {
    next(error);
  }
});

router.post('/blackjack/action', validate(z.object({
  body: z.object({ action: z.enum(['hit', 'stand', 'double']) }),
  params: z.object({}),
  query: z.object({})
})), async (req: AuthenticatedRequest, res, next) => {
  try {
    const stored = await redis.get(`blackjack:${req.user!.userId}`);
    if (!stored) {
      res.status(404).json({ success: false, error: 'No blackjack game in progress.' });
      return;
    }
    const parsed = JSON.parse(stored) as { state: any; deck: any[]; currency: 'SC' | 'GC' };
    let result;
    if (req.body.action === 'hit') result = hit(parsed.state, parsed.deck);
    else if (req.body.action === 'stand') result = stand(parsed.state, parsed.deck);
    else {
      await debitBalance(req.user!.userId, parsed.currency === 'SC' ? -parsed.state.bet : 0, parsed.currency === 'GC' ? -parsed.state.bet : 0);
      result = double(parsed.state, parsed.deck);
    }

    const payout = calculateBlackjackPayout(result.state);
    const user = await UserModel.findById(req.user!.userId);
    if (result.state.status !== 'playing') {
      await redis.del(`blackjack:${req.user!.userId}`);
      if (payout > 0) {
        await creditBalance(req.user!.userId, parsed.currency === 'SC' ? payout : 0, parsed.currency === 'GC' ? payout : 0);
        if (user) await recordWin(user.id, user.username, Math.max(0, payout - result.state.bet));
      }
      await GameSessionModel.create({
        userId: req.user!.userId,
        gameType: 'blackjack',
        betAmount: result.state.bet,
        currency: parsed.currency,
        outcome: result.state.status,
        winAmount: payout,
        metadata: result.state
      });
      await recordTransaction(req.user!.userId, payout > result.state.bet ? 'win' : 'loss', payout > 0 ? payout : result.state.bet, parsed.currency, {
        game: 'blackjack', status: result.state.status
      });
    } else {
      await redis.set(`blackjack:${req.user!.userId}`, JSON.stringify({ ...result, currency: parsed.currency }), 'EX', 60 * 30);
    }
    res.json({ success: true, data: { ...result.state, payout } });
  } catch (error) {
    next(error);
  }
});

router.post('/roulette/spin', validate(z.object({
  body: z.object({
    bets: z.array(z.object({
      type: z.enum(['straight', 'split', 'street', 'corner', 'red', 'black', 'even', 'odd', 'dozen', 'column']),
      numbers: z.array(z.number()).optional(),
      amount: betSchema,
      value: z.number().optional()
    })).min(1),
    currency: z.enum(['SC', 'GC'])
  }),
  params: z.object({}),
  query: z.object({})
})), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { bets, currency } = req.body as { bets: RouletteBet[]; currency: 'SC' | 'GC' };
    const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }
    await debitBalance(user.id, currency === 'SC' ? -totalBet : 0, currency === 'GC' ? -totalBet : 0);
    const result = spinRoulette(bets);
    if (result.winAmount > 0) {
      await creditBalance(user.id, currency === 'SC' ? result.winAmount : 0, currency === 'GC' ? result.winAmount : 0);
      await recordWin(user.id, user.username, Math.max(0, result.winAmount - totalBet));
    }
    await GameSessionModel.create({
      userId: user.id,
      gameType: 'roulette',
      betAmount: totalBet,
      currency,
      outcome: result.win ? 'win' : 'loss',
      winAmount: result.winAmount,
      metadata: { bets, result }
    });
    await recordTransaction(user.id, result.win ? 'win' : 'loss', result.win ? result.winAmount : totalBet, currency, { game: 'roulette' });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/baccarat/deal', validate(z.object({
  body: z.object({ bet: z.enum(['player', 'banker', 'tie']), amount: betSchema, currency: z.enum(['SC', 'GC']) }),
  params: z.object({}),
  query: z.object({})
})), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { bet, amount, currency } = req.body;
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }
    await debitBalance(user.id, currency === 'SC' ? -amount : 0, currency === 'GC' ? -amount : 0);
    const result = dealBaccarat();
    const payout = calculateBaccaratPayout(bet, result.winner, amount);
    if (payout > 0) {
      await creditBalance(user.id, currency === 'SC' ? payout : 0, currency === 'GC' ? payout : 0);
      await recordWin(user.id, user.username, Math.max(0, payout - amount));
    }
    await GameSessionModel.create({
      userId: user.id,
      gameType: 'baccarat',
      betAmount: amount,
      currency,
      outcome: result.winner,
      winAmount: payout,
      metadata: result
    });
    await recordTransaction(user.id, payout > 0 ? 'win' : 'loss', payout > 0 ? payout : amount, currency, { game: 'baccarat', winner: result.winner, bet });
    res.json({ success: true, data: { ...result, payout } });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const sessions = await GameSessionModel.findByUserId(req.user!.userId, page, limit);
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

export default router;
