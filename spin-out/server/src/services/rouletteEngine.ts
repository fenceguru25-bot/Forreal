import crypto from 'crypto';
import type { RouletteResult } from '../../../shared/src/types';

export interface RouletteBet {
  type: 'straight' | 'split' | 'street' | 'corner' | 'red' | 'black' | 'even' | 'odd' | 'dozen' | 'column';
  numbers?: number[];
  amount: number;
  value?: number;
}

const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const WHEEL_NUMBERS = Array.from({ length: 37 }, (_, number) => ({
  number,
  color: number === 0 ? 'green' : redNumbers.has(number) ? 'red' : 'black'
})) as Array<{ number: number; color: 'red' | 'black' | 'green' }>;

const getColumn = (number: number) => (number === 0 ? 0 : ((number - 1) % 3) + 1);
const getDozen = (number: number) => (number === 0 ? 0 : Math.ceil(number / 12));

export const calculateWinnings = (number: number, bets: RouletteBet[]): number => {
  const color = WHEEL_NUMBERS[number].color;
  return bets.reduce((total, bet) => {
    switch (bet.type) {
      case 'straight': return total + (bet.numbers?.includes(number) ? bet.amount * 36 : 0);
      case 'split': return total + (bet.numbers?.includes(number) ? bet.amount * 18 : 0);
      case 'street': return total + (bet.numbers?.includes(number) ? bet.amount * 12 : 0);
      case 'corner': return total + (bet.numbers?.includes(number) ? bet.amount * 9 : 0);
      case 'red':
      case 'black': return total + (color === bet.type ? bet.amount * 2 : 0);
      case 'even': return total + (number !== 0 && number % 2 === 0 ? bet.amount * 2 : 0);
      case 'odd': return total + (number % 2 === 1 ? bet.amount * 2 : 0);
      case 'dozen': return total + (getDozen(number) == bet.value ? bet.amount * 3 : 0);
      case 'column': return total + (getColumn(number) == bet.value ? bet.amount * 3 : 0);
      default: return total;
    }
  }, 0);
};

export const spin = (bets: RouletteBet[]): RouletteResult => {
  const number = crypto.randomInt(0, 37);
  const color = WHEEL_NUMBERS[number].color;
  const winAmount = Number(calculateWinnings(number, bets).toFixed(2));
  return { number, color, win: winAmount > 0, winAmount };
};
