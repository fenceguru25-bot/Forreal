import { useState } from 'react';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import { useUiStore } from '../store/uiStore';

const ResponsibleGaming = () => {
  const [depositLimit, setDepositLimit] = useState('100');
  const [sessionLimit, setSessionLimit] = useState('60');
  const addToast = useUiStore((state) => state.addToast);

  const selfExclude = async () => {
    try {
      await api.post('/user/self-exclude');
      addToast({ type: 'success', message: 'Self-exclusion has been activated.' });
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Unable to self-exclude.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black">Responsible Gaming</h1>
        <p className="mt-3 text-white/70">Use Spin Out for entertainment. Set personal limits, take breaks, and seek support if play stops being fun.</p>
      </div>
      <section className="glass-card rounded-3xl p-6">
        <h2 className="text-2xl font-bold">Self-Exclusion</h2>
        <p className="mt-3 text-white/70">Pause your account and block gameplay access immediately.</p>
        <Button className="mt-5" variant="danger" onClick={selfExclude}>Activate Self-Exclusion</Button>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold">Deposit Limits</h2>
          <input className="mt-4 w-full rounded-2xl bg-white/5 px-4 py-3" value={depositLimit} onChange={(event) => setDepositLimit(event.target.value)} />
          <p className="mt-3 text-sm text-white/60">Suggested weekly coin purchase limit in USD.</p>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold">Session Time Limits</h2>
          <input className="mt-4 w-full rounded-2xl bg-white/5 px-4 py-3" value={sessionLimit} onChange={(event) => setSessionLimit(event.target.value)} />
          <p className="mt-3 text-sm text-white/60">Suggested reminder interval in minutes.</p>
        </div>
      </section>
      <section className="glass-card rounded-3xl p-6">
        <h2 className="text-2xl font-bold">Support Resources</h2>
        <ul className="mt-4 space-y-2 text-white/75">
          <li>NCPG Helpline: <strong>1-800-522-4700</strong></li>
          <li>Reality check reminders: step away every {sessionLimit} minutes.</li>
          <li>Talk to a trusted friend, therapist, or support specialist if your play feels stressful.</li>
        </ul>
      </section>
    </div>
  );
};

export default ResponsibleGaming;
