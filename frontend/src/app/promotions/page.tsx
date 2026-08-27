'use client';

import { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: string;
  gcAmount: number;
  scAmount: number;
  expiresAt?: string | null;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPromotions = async () => {
    try {
      const response = await apiFetch<{ items: Promotion[] }>('/api/promotions');
      setPromotions(response.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load promotions');
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const claimPromotion = async (id: string) => {
    setMessage('');
    setError('');
    try {
      const response = await apiFetch<{ message: string }>(`/api/promotions/claim/${id}`, { method: 'POST' });
      setMessage(response.message);
      await loadPromotions();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to claim promotion');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-casino-gold">Promotions</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Claim your available offers</h1>
      </div>
      {(message || error) ? (
        <p className={`text-sm ${error ? 'text-rose-300' : 'text-emerald-300'}`}>{message || error}</p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        {promotions.map((promotion) => (
          <article key={promotion.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-casino-gold">{promotion.type.replaceAll('_', ' ')}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{promotion.name}</h2>
            <p className="mt-3 text-sm text-slate-300">{promotion.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-white/10 px-3 py-1">+{promotion.gcAmount} GC</span>
              <span className="rounded-full border border-white/10 px-3 py-1">+{promotion.scAmount} SC</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              {promotion.expiresAt ? `Expires ${new Date(promotion.expiresAt).toLocaleString()}` : 'No listed expiry'}
            </p>
            <button
              onClick={() => claimPromotion(promotion.id)}
              className="mt-5 rounded-xl bg-casino-gold px-4 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67]"
            >
              Claim bonus
            </button>
          </article>
        ))}
        {!promotions.length ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-400">
            No active promotions available.
          </div>
        ) : null}
      </div>
    </div>
  );
}
