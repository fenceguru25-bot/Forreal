'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { apiFetch } from '@/lib/api';

const states = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','IL','IN','IA','KS','KY','LA','ME','MD','MA','MN','MS','MO','MT','NE','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY','DC',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    state: 'CA',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiFetch<{ token: string; user: unknown; wallet: unknown; message: string }>('/api/auth/register', {
        method: 'POST',
        body: form,
      });

      localStorage.setItem('forreal.token', response.token);
      localStorage.setItem('forreal.user', JSON.stringify(response.user));
      localStorage.setItem('forreal.wallet', JSON.stringify(response.wallet));
      setSuccess(response.message);
      router.push('/wallet');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow">
      <h1 className="text-3xl font-bold text-white">Create your account</h1>
      <p className="mt-2 text-sm text-slate-300">Start with a 100 GC + 1 SC welcome bonus and access all promotional flows.</p>
      <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">First Name</label>
          <input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Last Name</label>
          <input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-200">Email</label>
          <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-200">Password</label>
          <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} minLength={8} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Date of Birth</label>
          <input type="date" value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">State</label>
          <select value={form.state} onChange={(event) => updateField('state', event.target.value)}>
            {states.map((state) => (
              <option key={state} value={state} className="bg-casino-night text-white">
                {state}
              </option>
            ))}
          </select>
        </div>
        {(error || success) ? (
          <p className={`sm:col-span-2 text-sm ${error ? 'text-rose-300' : 'text-emerald-300'}`}>
            {error || success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 rounded-xl bg-casino-gold px-4 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-300">
        Already registered?{' '}
        <Link href="/auth/login" className="font-semibold text-casino-gold hover:text-[#e7bb67]">
          Login here
        </Link>
      </p>
    </div>
  );
}
