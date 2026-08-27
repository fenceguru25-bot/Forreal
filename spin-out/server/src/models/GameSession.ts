import type { GameSession } from '../../../shared/src/types';
import { query } from '../db/pool';

const mapGameSession = (row: Record<string, unknown>): GameSession => ({
  id: String(row.id),
  userId: String(row.user_id),
  gameType: row.game_type as GameSession['gameType'],
  betAmount: Number(row.bet_amount),
  currency: row.currency as GameSession['currency'],
  outcome: String(row.outcome ?? ''),
  winAmount: Number(row.win_amount),
  provableSeed: String(row.provable_seed ?? ''),
  createdAt: new Date(String(row.created_at)).toISOString()
});

export class GameSessionModel {
  static async create(input: {
    userId: string;
    gameType: GameSession['gameType'];
    betAmount: number;
    currency: GameSession['currency'];
    outcome: string;
    winAmount: number;
    provableSeed?: string;
    metadata?: unknown;
  }): Promise<GameSession> {
    const result = await query(
      `INSERT INTO game_sessions (user_id, game_type, bet_amount, currency, outcome, win_amount, provable_seed, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.userId,
        input.gameType,
        input.betAmount,
        input.currency,
        input.outcome,
        input.winAmount,
        input.provableSeed ?? '',
        JSON.stringify(input.metadata ?? {})
      ]
    );

    return mapGameSession(result.rows[0] as Record<string, unknown>);
  }

  static async findByUserId(userId: string, page = 1, limit = 20): Promise<GameSession[]> {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM game_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map((row) => mapGameSession(row as Record<string, unknown>));
  }

  static async getStats(): Promise<{ totalPlayers: number; totalTransactions: number; activeGames: number }> {
    const [users, transactions, activeGames] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM users'),
      query('SELECT COUNT(*)::int AS count FROM transactions'),
      query(`SELECT COUNT(*)::int AS count FROM game_sessions WHERE created_at >= NOW() - INTERVAL '24 hours'`)
    ]);

    return {
      totalPlayers: Number(users.rows[0].count),
      totalTransactions: Number(transactions.rows[0].count),
      activeGames: Number(activeGames.rows[0].count)
    };
  }
}
