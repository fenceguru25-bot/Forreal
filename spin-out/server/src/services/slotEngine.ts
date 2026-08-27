import crypto from 'crypto';
import { REEL_COUNT, ROW_COUNT } from '../../../shared/src/constants';
import type { SlotResult } from '../../../shared/src/types';

const weightedSymbols = [
  '🍒', '🍒', '🍒', '🍒',
  '🍋', '🍋', '🍋',
  '🍊', '🍊', '🍊',
  '🍇', '🍇',
  '💎', '⭐', '🔔',
  '7️⃣', '🃏', '🎰'
];

const paylines = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2]
];

export const generateServerSeed = (): string => crypto.randomBytes(32).toString('hex');
export const hashSeed = (serverSeed: string, clientSeed: string, nonce: number): string =>
  crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');

const getSymbolFromHash = (hash: string, position: number): string => {
  const pair = hash.slice(position * 2, position * 2 + 2);
  const value = Number.parseInt(pair, 16);
  return weightedSymbols[value % weightedSymbols.length];
};

const evaluateLine = (symbols: string[]): number => {
  const baseSymbol = symbols.find((symbol) => symbol !== '🃏') ?? '🃏';
  let count = 0;
  for (const symbol of symbols) {
    if (symbol === baseSymbol || symbol === '🃏') count += 1;
    else break;
  }
  if (count >= 5) return 20;
  if (count === 4) return 5;
  if (count === 3) return 2;
  return 0;
};

export const spin = (bet: number, _currency: 'SC' | 'GC', serverSeed: string, clientSeed: string, nonce: number): SlotResult => {
  const reels: string[][] = Array.from({ length: ROW_COUNT }, () => Array(REEL_COUNT).fill('🍒'));
  const baseHash = hashSeed(serverSeed, clientSeed, nonce);

  for (let reel = 0; reel < REEL_COUNT; reel += 1) {
    const reelHash = crypto.createHash('sha256').update(`${baseHash}:${reel}`).digest('hex');
    for (let row = 0; row < ROW_COUNT; row += 1) {
      reels[row][reel] = getSymbolFromHash(reelHash, row + reel * ROW_COUNT);
    }
  }

  let totalWin = 0;
  let multiplier = 0;
  const winningPaylines: number[] = [];
  paylines.forEach((line, index) => {
    const lineSymbols = line.map((row, reel) => reels[row][reel]);
    const lineMultiplier = evaluateLine(lineSymbols);
    if (lineMultiplier > 0) {
      winningPaylines.push(index);
      totalWin += bet * lineMultiplier;
      multiplier = Math.max(multiplier, lineMultiplier);
    }
  });

  const scatterCount = reels.flat().filter((symbol) => symbol === '🎰').length;
  return {
    reels,
    paylines: winningPaylines,
    winAmount: Number(totalWin.toFixed(2)),
    freeSpins: scatterCount >= 3 ? 10 : 0,
    multiplier
  };
};
