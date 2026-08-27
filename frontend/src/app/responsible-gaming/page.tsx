'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';

interface StatusResponse {
  isSelfExcluded: boolean;
  selfExcludedUntil: string | null;
  depositLimit: number | null;
  selfExcludedActive: boolean;
}

export default function ResponsibleGamingPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [period, setPeriod] = useState('30');
  const [depositLimit, setDepositLimit] = useState('100');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStatus = async () => {
    try {
      const response = await apiFetch<StatusResponse>('/api/responsible-gaming/status');
      setStatus(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load RG settings');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const submitSelfExclusion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await apiFetch<{ message: string }>('/api/responsible-gaming/self-exclude', {
        method: 'POST',
        body: { period },
      });
      setMessage(response.message);
      await loadStatus();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to set self-exclusion');
    }
  };

  const submitDepositLimit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await apiFetch<{ message: string }>('/api/responsible-gaming/deposit-limit', {
        method: 'POST',
        body: { amount: Number(depositLimit) },
      });
      setMessage(response.message);
      await loadStatus();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to set deposit limit');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-casino-gold">Responsible Gaming</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Control your play</h1>
          <p className="mt-3 text-sm text-slate-300">
            Use responsible gaming tools to set boundaries and pause access whenever needed.
          </p>
          {(message || error) ? (
            <p className={`mt-4 text-sm ${error ? 'text-rose-300' : 'text-emerald-300'}`}>{message || error}</p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Self-exclusion</h2>
          <form className="mt-4 space-y-4" onSubmit={submitSelfExclusion}>
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">365 days</option>
              <option value="permanent">Permanent</option>
            </select>
            <button className="rounded-xl bg-casino-gold px-4 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67]" type="submit">
              Enable self-exclusion
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Daily deposit limit</h2>
          <form className="mt-4 space-y-4" onSubmit={submitDepositLimit}>
            <input type="number" min="1" step="1" value={depositLimit} onChange={(event) => setDepositLimit(event.target.value)} />
            <button className="rounded-xl bg-casino-gold px-4 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67]" type="submit">
              Save deposit limit
            </button>
          </form>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-casino-velvet/70 p-6">
          <h2 className="text-xl font-semibold text-white">Current status</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>Self-exclusion active: {status?.selfExcludedActive ? 'Yes' : 'No'}</p>
            <p>Self-excluded until: {status?.selfExcludedUntil ? new Date(status.selfExcludedUntil).toLocaleDateString() : 'Not set'}</p>
            <p>Daily deposit limit: {status?.depositLimit ? `$${status.depositLimit}` : 'Not set'}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Support resources</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-casino-gold">
            <Link href="https://www.ncpgambling.org" target="_blank" rel="noreferrer">
              National Council on Problem Gambling
            </Link>
            <Link href="https://www.1800gambler.net" target="_blank" rel="noreferrer">
              1-800-GAMBLER support network
            </Link>
            <Link href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noreferrer">
              SAMHSA National Helpline
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
