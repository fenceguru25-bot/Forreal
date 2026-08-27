import { useMemo } from 'react';
import { MAX_BET, MIN_BET } from '../../../shared/src/constants';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';

export const useGame = () => {
  const game = useGameStore();
  const user = useAuthStore((state) => state.user);
  const addToast = useUiStore((state) => state.addToast);

  const activeBalance = useMemo(() => game.currency === 'SC' ? user?.sweepsCoins ?? 0 : user?.goldCoins ?? 0, [game.currency, user]);

  const validateBet = () => {
    if (game.betAmount < MIN_BET || game.betAmount > MAX_BET) {
      addToast({ type: 'error', message: `Bet must be between ${MIN_BET} and ${MAX_BET}.` });
      return false;
    }
    if (game.betAmount > activeBalance) {
      addToast({ type: 'error', message: 'Insufficient balance for this bet.' });
      return false;
    }
    return true;
  };

  return { ...game, activeBalance, validateBet };
};
