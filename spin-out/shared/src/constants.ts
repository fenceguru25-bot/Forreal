import type { CoinPackage } from './types';

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'starter', name: 'Starter Stack', goldCoins: 450, sweepsCoins: 1, price: 4.99, popular: false },
  { id: 'silver', name: 'Silver Spin', goldCoins: 1000, sweepsCoins: 2, price: 9.99, popular: true },
  { id: 'gold', name: 'Gold Rush', goldCoins: 2100, sweepsCoins: 5, price: 19.99, popular: false },
  { id: 'platinum', name: 'Platinum Vault', goldCoins: 5500, sweepsCoins: 15, price: 49.99, popular: false },
  { id: 'diamond', name: 'Diamond Deluxe', goldCoins: 12000, sweepsCoins: 35, price: 99.99, popular: false }
];

export const RESTRICTED_STATES = ['WA', 'ID', 'MI', 'NV', 'KY', 'AR'] as const;
export const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '⭐', '7️⃣', '🔔', '🃏', '🎰'] as const;
export const REEL_COUNT = 5;
export const ROW_COUNT = 3;
export const MIN_BET = 0.1;
export const MAX_BET = 500;
export const CASHAPP_CASHTAG = '$FENCEGUEULLC';
export const DAILY_BONUS_SC = 1;
