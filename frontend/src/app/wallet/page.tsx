'use client';

import { useEffect, useState } from 'react';

import WalletDisplay from '@/components/WalletDisplay';
import { apiFetch } from '@/lib/api';

interface WalletResponse {
  gcBalance: number;
  scBalance: number;
  updatedAt: string;
}

interface TransactionResponse {
  items: Array<{
    id: string;
    type: string;
    currency: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse['items']>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const [walletResponse, transactionResponse] = await Promise.all([
          apiFetch<WalletResponse>('/api/wallet/balance'),
          apiFetch<TransactionResponse>('/api/wallet/transactions?page=1&pageSize=10'),
        ]);
        setWallet(walletResponse);
        setTransactions(transactionResponse.items);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load wallet');
      }
    };

    loadWallet();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-casino-gold">Wallet Center</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Balances and transaction history</h1>
      </div>

      {wallet ? <WalletDisplay gcBalance={wallet.gcBalance} scBalance={wallet.scBalance} /> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">GC Purchase Placeholder</h2>
          <p className="mt-3 text-sm text-slate-300">
            Add cashier, payments, package bundles, and daily deposit-limit enforcement here in future phases.
          </p>
          <button className="mt-5 rounded-xl border border-casino-gold/40 px-4 py-3 text-sm font-semibold text-casino-gold hover:bg-casino-gold/10">
            View coin packs
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">SC Redemption Placeholder</h2>
          <p className="mt-3 text-sm text-slate-300">
            Redemption eligibility, KYC review, and prize-out workflows will plug into this section.
          </p>
          <button className="mt-5 rounded-xl border border-casino-gold/40 px-4 py-3 text-sm font-semibold text-casino-gold hover:bg-casino-gold/10">
            Start redemption
          </button>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-casino-velvet/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Recent transactions</h2>
          <span className="text-sm text-slate-400">Latest 10 entries</span>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
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
                  <td className="py-3">{transaction.type}</td>
                  <td className="py-3">{transaction.currency}</td>
                  <td className="py-3">{transaction.amount}</td>
                  <td className="py-3">{transaction.description}</td>
                  <td className="py-3">{new Date(transaction.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!transactions.length ? (
                <tr>
                  <td className="py-4 text-slate-400" colSpan={5}>
                    No transactions available yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
