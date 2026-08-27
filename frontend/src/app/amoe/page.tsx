'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import { apiFetch } from '@/lib/api';

export default function AmoePage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: 'CA',
    zip: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await apiFetch<{ message: string }>('/api/promotions/amoe', {
        method: 'POST',
        body: form,
      });
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit AMOE entry');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-casino-gold">AMOE</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Alternative Method of Entry</h1>
        <p className="mt-3 text-sm text-slate-300">
          Submit your free mail-in style entry details. No purchase is necessary to participate where permitted by law.
        </p>
      </div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <input placeholder="First name" value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required />
        <input placeholder="Last name" value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required />
        <input className="sm:col-span-2" type="email" placeholder="Email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
        <input className="sm:col-span-2" placeholder="Street address" value={form.address} onChange={(event) => updateField('address', event.target.value)} required />
        <input placeholder="City" value={form.city} onChange={(event) => updateField('city', event.target.value)} required />
        <input placeholder="State" value={form.state} onChange={(event) => updateField('state', event.target.value.toUpperCase())} maxLength={2} required />
        <input placeholder="ZIP" value={form.zip} onChange={(event) => updateField('zip', event.target.value)} required />
        {(message || error) ? (
          <p className={`sm:col-span-2 text-sm ${error ? 'text-rose-300' : 'text-emerald-300'}`}>{message || error}</p>
        ) : null}
        <button className="sm:col-span-2 rounded-xl bg-casino-gold px-4 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67]" type="submit">
          Submit free entry
        </button>
      </form>
      <div className="rounded-2xl border border-white/10 bg-casino-velvet/70 p-4 text-sm text-slate-300">
        No purchase necessary. Void where prohibited. Entries are subject to eligibility review, geolocation restrictions, and platform terms.
      </div>
    </div>
  );
}
