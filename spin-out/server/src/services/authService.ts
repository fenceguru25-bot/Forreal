import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from '../../../shared/src/types';
import { redis } from '../db/redis';

const jwtSecret = process.env.JWT_SECRET ?? 'spin-out-dev-secret';
const refreshSecret = process.env.REFRESH_TOKEN_SECRET ?? 'spin-out-refresh-secret';
const expiresIn = process.env.JWT_EXPIRES_IN ?? '15m';

export const generateJWT = (payload: JwtPayload): string => jwt.sign(payload, jwtSecret as Secret, { expiresIn: expiresIn as SignOptions['expiresIn'] });
export const verifyJWT = (token: string): JwtPayload => jwt.verify(token, jwtSecret) as JwtPayload;
export const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

export const generateRefreshToken = (): string => {
  return crypto.createHmac('sha256', refreshSecret).update(`${crypto.randomUUID()}:${Date.now()}`).digest('hex');
};

export const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
  await redis.set(`refresh:${userId}`, token, 'EX', 60 * 60 * 24 * 30);
};

export const verifyRefreshToken = async (userId: string, token: string): Promise<boolean> => {
  const storedToken = await redis.get(`refresh:${userId}`);
  return storedToken === token;
};

export const deleteRefreshToken = async (userId: string): Promise<void> => {
  await redis.del(`refresh:${userId}`);
};
