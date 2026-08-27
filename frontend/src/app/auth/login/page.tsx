'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch<{ token: string; user: unknown; wallet: unknown }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      localStorage.setItem('forreal.token', response.token);
      localStorage.setItem('forreal.user', JSON.stringify(response.user));
      localStorage.setItem('forreal.wallet', JSON.stringify(response.wallet));
      router.push('/wallet');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow">
      <h1 className="text-3xl font-bold text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-300">Sign in to access your wallet, promotions, and free entry tools.</p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Email</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Password</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-casino-gold px-4 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-300">
        Need an account?{' '}
        <Link href="/auth/register" className="font-semibold text-casino-gold hover:text-[#e7bb67]">
          Register here
        </Link>
      </p>
    </div>
  );
}
