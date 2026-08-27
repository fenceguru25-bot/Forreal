import type { Transaction } from '../../../shared/src/types';
import { TransactionModel } from '../models/Transaction';

export const recordTransaction = async (
  userId: string,
  type: Transaction['type'],
  amount: number,
  currency: Transaction['currency'],
  metadata: Record<string, unknown> = {}
) => TransactionModel.create({ userId, type, amount, currency, metadata });

export const getUserTransactions = async (userId: string, page = 1, limit = 20) => TransactionModel.findByUserId(userId, page, limit);
