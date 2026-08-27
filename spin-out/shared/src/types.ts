export interface User {
  id: string;
  username: string;
  email: string;
  sweepsCoins: number;
  goldCoins: number;
  role: 'player' | 'admin';
  state: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'redemption' | 'win' | 'loss' | 'daily_bonus';
  amount: number;
  currency: 'SC' | 'GC';
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GameSession {
  id: string;
  userId: string;
  gameType: 'slot' | 'blackjack' | 'roulette' | 'baccarat';
  betAmount: number;
  currency: 'SC' | 'GC';
  outcome: string;
  winAmount: number;
  provableSeed: string;
  createdAt: string;
}

export interface SlotResult {
  reels: string[][];
  paylines: number[];
  winAmount: number;
  freeSpins: number;
  multiplier: number;
}

export interface Card {
  suit: string;
  value: string;
  numericValue: number;
}

export interface BlackjackState {
  playerHand: Card[];
  dealerHand: Card[];
  playerScore: number;
  dealerScore: number;
  status: 'playing' | 'player_bust' | 'dealer_bust' | 'player_win' | 'dealer_win' | 'push';
  bet: number;
}

export interface RouletteResult {
  number: number;
  color: 'red' | 'black' | 'green';
  win: boolean;
  winAmount: number;
}

export interface CoinPackage {
  id: string;
  name: string;
  goldCoins: number;
  sweepsCoins: number;
  price: number;
  popular: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'player' | 'admin';
}
