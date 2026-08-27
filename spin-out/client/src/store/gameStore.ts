import { create } from 'zustand';
import { api } from '../lib/api';
import { useAuthStore } from './authStore';

interface BalanceState {
  sweepsCoins: number;
  goldCoins: number;
}

interface GameState {
  currentGame: string | null;
  betAmount: number;
  currency: 'SC' | 'GC';
  isSpinning: boolean;
  lastResult: any;
  balance: BalanceState;
  setBet: (betAmount: number) => void;
  setCurrency: (currency: 'SC' | 'GC') => void;
  setCurrentGame: (game: string | null) => void;
  syncBalance: () => Promise<void>;
  spinSlots: (payload: { clientSeed: string; nonce: number }) => Promise<any>;
  blackjackAction: (action: 'start' | 'hit' | 'stand' | 'double') => Promise<any>;
  spinRoulette: (bets: { type: string; numbers?: number[]; amount: number; value?: number }[]) => Promise<any>;
  dealBaccarat: (bet: 'player' | 'banker' | 'tie') => Promise<any>;
}

const syncUser = async () => {
  const response = await api.get('/user/profile');
  const user = response.data.data.user;
  useAuthStore.getState().updateUser(user);
  return user;
};

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  betAmount: 1,
  currency: 'GC',
  isSpinning: false,
  lastResult: null,
  balance: { sweepsCoins: 0, goldCoins: 0 },
  setBet: (betAmount) => set({ betAmount }),
  setCurrency: (currency) => set({ currency }),
  setCurrentGame: (currentGame) => set({ currentGame }),
  syncBalance: async () => {
    const user = await syncUser();
    set({ balance: { sweepsCoins: user.sweepsCoins, goldCoins: user.goldCoins } });
  },
  spinSlots: async ({ clientSeed, nonce }) => {
    set({ isSpinning: true });
    try {
      const { betAmount, currency } = get();
      const response = await api.post('/games/slots/spin', { bet: betAmount, currency, clientSeed, nonce });
      await get().syncBalance();
      set({ lastResult: response.data.data.result, isSpinning: false });
      return response.data.data.result;
    } catch (error) {
      set({ isSpinning: false });
      throw error;
    }
  },
  blackjackAction: async (action) => {
    const { betAmount, currency } = get();
    const response = action === 'start'
      ? await api.post('/games/blackjack/start', { bet: betAmount, currency })
      : await api.post('/games/blackjack/action', { action });
    await get().syncBalance();
    set({ lastResult: response.data.data });
    return response.data.data;
  },
  spinRoulette: async (bets) => {
    const { currency } = get();
    const response = await api.post('/games/roulette/spin', { bets, currency });
    await get().syncBalance();
    set({ lastResult: response.data.data });
    return response.data.data;
  },
  dealBaccarat: async (bet) => {
    const { currency, betAmount } = get();
    const response = await api.post('/games/baccarat/deal', { bet, amount: betAmount, currency });
    await get().syncBalance();
    set({ lastResult: response.data.data });
    return response.data.data;
  }
}));
