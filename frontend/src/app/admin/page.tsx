'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiFetch } from '@/lib/api';

interface Player {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  state: string;
  accountTier: string;
  wallet?: {
    gcBalance: number;
    scBalance: number;
  } | null;
}

interface Transaction {
  id: string;
  type: string;
  currency: string;
  amount: number;
  description: string;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('forreal.user');
    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'admin@forreal.com').toLowerCase();
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    if (!parsedUser?.email || parsedUser.email.toLowerCase() !== adminEmail) {
      setError('Admin access required');
      router.replace('/');
      return;
    }

    const loadAdminData = async () => {
      try {
        const [playersResponse, transactionsResponse] = await Promise.all([
          apiFetch<{ items: Player[] }>('/api/admin/players?page=1&pageSize=10'),
          apiFetch<{ items: Transaction[] }>('/api/admin/transactions?page=1&pageSize=10'),
        ]);
        setPlayers(playersResponse.items);
        setTransactions(transactionsResponse.items);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load admin dashboard');
      }
    };

    loadAdminData();
  }, [router]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-casino-gold">Admin Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Player operations overview</h1>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Players</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">State</th>
                <th className="pb-3">Tier</th>
                <th className="pb-3">GC</th>
                <th className="pb-3">SC</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-t border-white/10 text-slate-200">
                  <td className="py-3">{player.firstName} {player.lastName}</td>
                  <td className="py-3">{player.email}</td>
                  <td className="py-3">{player.state}</td>
                  <td className="py-3">{player.accountTier}</td>
                  <td className="py-3">{player.wallet?.gcBalance ?? 0}</td>
                  <td className="py-3">{player.wallet?.scBalance ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-casino-velvet/70 p-6">
        <h2 className="text-xl font-semibold text-white">Transaction log</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3">Player</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Currency</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-white/10 text-slate-200">
                  <td className="py-3">{transaction.user.firstName} {transaction.user.lastName}</td>
                  <td className="py-3">{transaction.type}</td>
                  <td className="py-3">{transaction.currency}</td>
                  <td className="py-3">{transaction.amount}</td>
                  <td className="py-3">{transaction.description}</td>
                  <td className="py-3">{new Date(transaction.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
