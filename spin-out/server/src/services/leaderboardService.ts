import { redis } from '../db/redis';

const getDailyKey = () => `daily:leaderboard:${new Date().toISOString().slice(0, 10)}`;
const getWeeklyKey = () => {
  const now = new Date();
  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const diff = Math.floor((now.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.ceil((diff + firstDay.getUTCDay() + 1) / 7);
  return `weekly:leaderboard:${now.getUTCFullYear()}-${week}`;
};

export const recordWin = async (userId: string, username: string, amount: number) => {
  const member = `${userId}|${username}`;
  const dailyKey = getDailyKey();
  const weeklyKey = getWeeklyKey();
  await redis.zincrby(dailyKey, amount, member);
  await redis.zincrby(weeklyKey, amount, member);
  await redis.expire(dailyKey, 60 * 60 * 24 * 8);
  await redis.expire(weeklyKey, 60 * 60 * 24 * 8);
  await redis.publish('leaderboard:updates', JSON.stringify({ userId, username, amount }));
};

const getBoard = async (key: string) => {
  const raw = await redis.zrevrange(key, 0, 19, 'WITHSCORES');
  const entries = [] as Array<{ rank: number; username: string; amount: number }>;
  for (let i = 0; i < raw.length; i += 2) {
    const [_, username] = raw[i].split('|');
    entries.push({ rank: entries.length + 1, username, amount: Number(raw[i + 1]) });
  }
  return entries;
};

export const getDailyLeaderboard = async () => getBoard(getDailyKey());
export const getWeeklyLeaderboard = async () => getBoard(getWeeklyKey());
