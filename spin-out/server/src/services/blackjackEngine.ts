import crypto from 'crypto';
import type { BlackjackState, Card } from '../../../shared/src/types';

const suits = ['♠', '♥', '♦', '♣'];
const values = [
  { value: 'A', numericValue: 11 },
  { value: '2', numericValue: 2 },
  { value: '3', numericValue: 3 },
  { value: '4', numericValue: 4 },
  { value: '5', numericValue: 5 },
  { value: '6', numericValue: 6 },
  { value: '7', numericValue: 7 },
  { value: '8', numericValue: 8 },
  { value: '9', numericValue: 9 },
  { value: '10', numericValue: 10 },
  { value: 'J', numericValue: 10 },
  { value: 'Q', numericValue: 10 },
  { value: 'K', numericValue: 10 }
];

export const createDeck = (): Card[] => suits.flatMap((suit) => values.map((card) => ({ suit, ...card })));
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
export const dealCard = (deck: Card[]): { card: Card; remainingDeck: Card[] } => {
  const [card, ...remainingDeck] = deck;
  return { card, remainingDeck };
};
export const calculateScore = (hand: Card[]): number => {
  let total = hand.reduce((sum, card) => sum + card.numericValue, 0);
  let aces = hand.filter((card) => card.value === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
};

const getStatus = (playerScore: number, dealerScore: number): BlackjackState['status'] => {
  if (playerScore > 21) return 'player_bust';
  if (dealerScore > 21) return 'dealer_bust';
  if (playerScore > dealerScore) return 'player_win';
  if (dealerScore > playerScore) return 'dealer_win';
  return 'push';
};

export const determineWinner = (state: BlackjackState): BlackjackState => ({ ...state, status: getStatus(state.playerScore, state.dealerScore) });

export const startGame = (bet: number): { state: BlackjackState; deck: Card[] } => {
  let deck = shuffleDeck(createDeck());
  const playerHand: Card[] = [];
  const dealerHand: Card[] = [];
  for (let i = 0; i < 2; i += 1) {
    let dealt = dealCard(deck);
    playerHand.push(dealt.card);
    deck = dealt.remainingDeck;
    dealt = dealCard(deck);
    dealerHand.push(dealt.card);
    deck = dealt.remainingDeck;
  }
  const state: BlackjackState = {
    playerHand,
    dealerHand,
    playerScore: calculateScore(playerHand),
    dealerScore: calculateScore(dealerHand),
    status: 'playing',
    bet
  };
  if (state.playerScore === 21 || state.dealerScore === 21) return { state: determineWinner(state), deck };
  return { state, deck };
};

export const hit = (state: BlackjackState, deck: Card[]): { state: BlackjackState; deck: Card[] } => {
  const dealt = dealCard(deck);
  const playerHand = [...state.playerHand, dealt.card];
  const updatedState: BlackjackState = { ...state, playerHand, playerScore: calculateScore(playerHand) };
  return { state: updatedState.playerScore > 21 ? determineWinner(updatedState) : updatedState, deck: dealt.remainingDeck };
};

export const stand = (state: BlackjackState, deck: Card[]): { state: BlackjackState; deck: Card[] } => {
  let currentDeck = [...deck];
  const dealerHand = [...state.dealerHand];
  while (calculateScore(dealerHand) < 17) {
    const dealt = dealCard(currentDeck);
    dealerHand.push(dealt.card);
    currentDeck = dealt.remainingDeck;
  }
  return {
    state: determineWinner({ ...state, dealerHand, dealerScore: calculateScore(dealerHand) }),
    deck: currentDeck
  };
};

export const double = (state: BlackjackState, deck: Card[]): { state: BlackjackState; deck: Card[] } => {
  const doubledState = { ...state, bet: Number((state.bet * 2).toFixed(2)) };
  const hitResult = hit(doubledState, deck);
  return hitResult.state.status === 'playing' ? stand(hitResult.state, hitResult.deck) : hitResult;
};

export const calculatePayout = (state: BlackjackState): number => {
  if (state.status === 'push') return state.bet;
  if (state.status === 'player_win' || state.status === 'dealer_bust') {
    const blackjack = state.playerScore === 21 && state.playerHand.length === 2;
    return blackjack ? Number((state.bet * 2.5).toFixed(2)) : Number((state.bet * 2).toFixed(2));
  }
  return 0;
};
