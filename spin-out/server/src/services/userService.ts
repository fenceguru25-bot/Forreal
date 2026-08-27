import { DAILY_BONUS_SC } from '../../../shared/src/constants';
import { redis } from '../db/redis';
import { TransactionModel } from '../models/Transaction';
import { UserModel } from '../models/User';

export const getUserBalance = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  return { sweepsCoins: user.sweepsCoins, goldCoins: user.goldCoins };
};

export const creditBalance = async (userId: string, scAmount: number, gcAmount: number) => {
  const user = await UserModel.updateBalance(userId, scAmount, gcAmount);
  if (!user) throw new Error('Unable to credit balance.');
  return user;
};

export const debitBalance = async (userId: string, scAmount: number, gcAmount: number) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error('User not found.');
  if (user.sweepsCoins + scAmount < 0) throw new Error('Insufficient sweeps coin balance.');
  if (user.goldCoins + gcAmount < 0) throw new Error('Insufficient gold coin balance.');
  const updatedUser = await UserModel.updateBalance(userId, scAmount, gcAmount);
  if (!updatedUser) throw new Error('Unable to debit balance.');
  return updatedUser;
};

export const claimDailyBonus = async (userId: string) => {
  const key = `user:${userId}:daily_bonus`;
  const hasClaimed = await redis.get(key);
  if (hasClaimed) {
    throw new Error('Daily bonus already claimed in the last 24 hours.');
  }

  const user = await creditBalance(userId, DAILY_BONUS_SC, 0);
  await redis.set(key, 'claimed', 'EX', 60 * 60 * 24);
  await TransactionModel.create({
    userId,
    type: 'daily_bonus',
    amount: DAILY_BONUS_SC,
    currency: 'SC',
    metadata: { source: 'daily_bonus' }
  });
  return user;
};
