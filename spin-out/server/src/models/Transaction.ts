import type { Transaction } from '../../../shared/src/types';
import { query } from '../db/pool';

const mapTransaction = (row: Record<string, unknown>): Transaction => ({
  id: String(row.id),
  userId: String(row.user_id),
  type: row.type as Transaction['type'],
  amount: Number(row.amount),
  currency: row.currency as Transaction['currency'],
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  createdAt: new Date(String(row.created_at)).toISOString()
});

export class TransactionModel {
  static async create(input: { userId: string; type: Transaction['type']; amount: number; currency: Transaction['currency']; metadata?: Record<string, unknown> }): Promise<Transaction> {
    const result = await query(
      `INSERT INTO transactions (user_id, type, amount, currency, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.userId, input.type, input.amount, input.currency, JSON.stringify(input.metadata ?? {})]
    );

    return mapTransaction(result.rows[0] as Record<string, unknown>);
  }

  static async findByUserId(userId: string, page = 1, limit = 20): Promise<Transaction[]> {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map((row) => mapTransaction(row as Record<string, unknown>));
  }

  static async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    const result = await query(`SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1`, [limit]);
    return result.rows.map((row) => mapTransaction(row as Record<string, unknown>));
  }
}
