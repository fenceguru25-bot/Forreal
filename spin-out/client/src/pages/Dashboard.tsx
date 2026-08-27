import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.get('/user/transactions?limit=5').then((response) => setTransactions(response.data.data)).catch(() => undefined);
    api.get('/games/history?limit=5').then((response) => setHistory(response.data.data)).catch(() => undefined);
  }, []);

  const stats = useMemo(() => {
    const totalWins = history.reduce((sum, game) => sum + Number(game.winAmount || 0), 0);
    const totalGames = history.length;
    const winCount = history.filter((game) => Number(game.winAmount || 0) > 0).length;
    return { totalWins, totalGames, winRate: totalGames ? Math.round((winCount / totalGames) * 100) : 0 };
  }, [history]);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black">Account Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-3xl p-5"><p className="text-white/60">Sweeps Coins</p><p className="mt-2 text-3xl font-black text-gold">💜 {user ? user.sweepsCoins.toFixed(2) : '0.00'}</p></div>
        <div className="glass-card rounded-3xl p-5"><p className="text-white/60">Gold Coins</p><p className="mt-2 text-3xl font-black text-gold">🟡 {user ? user.goldCoins.toFixed(2) : '0.00'}</p></div>
        <div className="glass-card rounded-3xl p-5"><p className="text-white/60">Total Wins</p><p className="mt-2 text-3xl font-black">${stats.totalWins.toFixed(2)}</p></div>
        <div className="glass-card rounded-3xl p-5"><p className="text-white/60">Win Rate</p><p className="mt-2 text-3xl font-black">{stats.winRate}%</p></div>
      </div>
      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <div className="mt-4 space-y-3 text-white/75">
            <p>Username: {user?.username}</p>
            <p>Email: {user?.email}</p>
            <p>Member Since: {user ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
            <p>Total Games: {stats.totalGames}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold">Recent Transactions</h2>
          <div className="mt-4 space-y-3 text-sm">
            {transactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"><span>{transaction.type}</span><span>{transaction.amount} {transaction.currency}</span></div>)}
          </div>
        </div>
      </div>
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-2xl font-bold">Recent Game History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-white/60"><tr><th className="pb-3">Game</th><th className="pb-3">Bet</th><th className="pb-3">Win</th><th className="pb-3">Outcome</th></tr></thead>
            <tbody>
              {history.map((game) => <tr key={game.id} className="border-t border-white/10"><td className="py-3 capitalize">{game.gameType}</td><td>{game.betAmount} {game.currency}</td><td>{game.winAmount}</td><td className="capitalize">{game.outcome}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
