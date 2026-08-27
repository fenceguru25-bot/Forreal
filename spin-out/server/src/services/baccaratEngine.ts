import crypto from 'crypto';
import type { Card } from '../../../shared/src/types';

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const cardValue = (rank: string): number => rank === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(rank) ? 0 : Number(rank);
const createDeck = (): Card[] => suits.flatMap((suit) => ranks.map((value) => ({ suit, value, numericValue: cardValue(value) })));
const shuffle = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const calculateBaccaratScore = (hand: Card[]): number => hand.reduce((sum, card) => sum + card.numericValue, 0) % 10;

export const deal = (): { playerHand: Card[]; bankerHand: Card[]; winner: 'player' | 'banker' | 'tie' } => {
  const deck = shuffle(createDeck());
  const playerHand = [deck.shift()!, deck.shift()!];
  const bankerHand = [deck.shift()!, deck.shift()!];
  let playerScore = calculateBaccaratScore(playerHand);
  let bankerScore = calculateBaccaratScore(bankerHand);

  if (playerScore < 8 && bankerScore < 8) {
    let playerThirdCard: Card | undefined;
    if (playerScore <= 5) {
      playerThirdCard = deck.shift()!;
      playerHand.push(playerThirdCard);
      playerScore = calculateBaccaratScore(playerHand);
    }
    const shouldBankerDraw = () => {
      if (!playerThirdCard) return bankerScore <= 5;
      const third = playerThirdCard.numericValue;
      if (bankerScore <= 2) return true;
      if (bankerScore == 3) return third !== 8;
      if (bankerScore == 4) return [2, 3, 4, 5, 6, 7].includes(third);
      if (bankerScore == 5) return [4, 5, 6, 7].includes(third);
      if (bankerScore == 6) return [6, 7].includes(third);
      return false;
    };
    if (shouldBankerDraw()) {
      bankerHand.push(deck.shift()!);
      bankerScore = calculateBaccaratScore(bankerHand);
    }
  }

  const winner = playerScore === bankerScore ? 'tie' : playerScore > bankerScore ? 'player' : 'banker';
  return { playerHand, bankerHand, winner };
};

export const calculatePayout = (bet: 'player' | 'banker' | 'tie', winner: 'player' | 'banker' | 'tie', amount: number): number => {
  if (bet !== winner) return 0;
  if (bet === 'tie') return amount * 9;
  if (bet === 'banker') return Number((amount * 1.95).toFixed(2));
  return amount * 2;
};
