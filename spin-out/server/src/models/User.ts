import type { User } from '../../../shared/src/types';
import { query } from '../db/pool';

export interface UserRecord extends User {
  avatarUrl?: string | null;
  selfExcluded?: boolean;
  passwordHash?: string;
}

const mapUser = (row: Record<string, unknown>, includePasswordHash = false): UserRecord => {
  const user: UserRecord = {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    sweepsCoins: Number(row.sweeps_coins),
    goldCoins: Number(row.gold_coins),
    role: String(row.role) as User['role'],
    state: String(row.state ?? ''),
    createdAt: new Date(String(row.created_at)).toISOString(),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    selfExcluded: Boolean(row.self_excluded)
  };

  if (includePasswordHash && row.password_hash) {
    user.passwordHash = String(row.password_hash);
  }

  return user;
};

export class UserModel {
  static async findById(id: string): Promise<UserRecord | null> {
    const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>) : null;
  }

  static async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>, true) : null;
  }

  static async create(input: { username: string; email: string; passwordHash: string; state: string; role?: 'player' | 'admin' }): Promise<UserRecord> {
    const result = await query(
      `INSERT INTO users (username, email, password_hash, state, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.username, input.email, input.passwordHash, input.state, input.role ?? 'player']
    );

    return mapUser(result.rows[0] as Record<string, unknown>);
  }

  static async updateBalance(id: string, sweepsDelta: number, goldDelta: number): Promise<UserRecord | null> {
    const result = await query(
      `UPDATE users
       SET sweeps_coins = sweeps_coins + $2,
           gold_coins = gold_coins + $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, sweepsDelta, goldDelta]
    );

    return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>) : null;
  }

  static async updateProfile(id: string, updates: { username?: string; avatarUrl?: string | null }): Promise<UserRecord | null> {
    const result = await query(
      `UPDATE users
       SET username = COALESCE($2, username),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, updates.username ?? null, updates.avatarUrl ?? null]
    );

    return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>) : null;
  }

  static async setSelfExcluded(id: string, selfExcluded: boolean): Promise<UserRecord | null> {
    const result = await query(
      `UPDATE users
       SET self_excluded = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, selfExcluded]
    );

    return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>) : null;
  }

  static async getAllUsers(): Promise<UserRecord[]> {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map((row) => mapUser(row as Record<string, unknown>));
  }
}
