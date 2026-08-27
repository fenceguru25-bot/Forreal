import type { Server } from 'socket.io';
import { redis } from '../db/redis';
import { verifyJWT } from '../services/authService';
import { double, hit, stand } from '../services/blackjackEngine';
import { spin as spinRoulette } from '../services/rouletteEngine';
import { generateServerSeed, spin as spinSlots } from '../services/slotEngine';

export const registerGameSocketHandlers = (io: Server): void => {
  const subscriber = redis.duplicate();

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        socket.data.user = verifyJWT(token);
      } catch {
        socket.emit('error-message', { message: 'Invalid token provided to socket connection.' });
      }
    }

    socket.on('join-game', (room: string) => socket.join(room));
    socket.on('leave-game', (room: string) => socket.leave(room));

    socket.on('slot:spin', ({ bet, currency, clientSeed, nonce }, callback) => {
      const result = spinSlots(bet, currency, generateServerSeed(), clientSeed, nonce);
      socket.emit('slot:result', result);
      if (result.winAmount > 0) socket.emit('win-animation', { type: 'slots', amount: result.winAmount, multiplier: result.multiplier });
      callback?.(result);
    });

    socket.on('blackjack:action', async ({ action }, callback) => {
      const user = socket.data.user;
      if (!user) {
        callback?.({ success: false, error: 'Unauthorized socket user.' });
        return;
      }
      const stored = await redis.get(`blackjack:${user.userId}`);
      if (!stored) {
        callback?.({ success: false, error: 'No blackjack game found.' });
        return;
      }
      const parsed = JSON.parse(stored) as { state: any; deck: any[] };
      const result = action === 'hit' ? hit(parsed.state, parsed.deck) : action === 'double' ? double(parsed.state, parsed.deck) : stand(parsed.state, parsed.deck);
      await redis.set(`blackjack:${user.userId}`, JSON.stringify(result), 'EX', 60 * 30);
      socket.emit('blackjack:update', result.state);
      callback?.({ success: true, data: result.state });
    });

    socket.on('roulette:bet', ({ bets }, callback) => {
      const result = spinRoulette(bets);
      socket.emit('roulette:result', result);
      if (result.win) socket.emit('win-animation', { type: 'roulette', amount: result.winAmount, multiplier: result.winAmount });
      callback?.(result);
    });

    socket.on('leaderboard:subscribe', async () => {
      await socket.join('leaderboard');
    });
  });

  subscriber.subscribe('leaderboard:updates');
  subscriber.on('message', (channel, payload) => {
    if (channel === 'leaderboard:updates') io.to('leaderboard').emit('leaderboard:update', JSON.parse(payload));
  });
};
