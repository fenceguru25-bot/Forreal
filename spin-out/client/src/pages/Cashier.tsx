import { useState } from 'react';
import { COIN_PACKAGES } from '../../../shared/src/constants';
import CoinPackage from '../components/CoinPackage';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const Cashier = () => {
  const [tab, setTab] = useState<'buy' | 'redeem'>('buy');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const addToast = useUiStore((state) => state.addToast);

  const buyPackage = async (packageId: string, amount: number) => {
    setLoadingId(packageId);
    try {
      const response = await api.post('/cashapp/create-payment', { packageId, amount });
      window.open(response.data.data.paymentUrl, '_blank', 'noopener,noreferrer');
      addToast({ type: 'info', message: 'Cash App payment window opened.' });
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Unable to create payment.' });
    } finally {
      setLoadingId(null);
    }
  };

  const claimBonus = async () => {
    try {
      const response = await api.post('/user/daily-bonus');
      addToast({ type: 'success', message: response.data.message ?? 'Daily bonus claimed.' });
      useAuthStore.getState().updateUser(response.data.data);
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Unable to claim daily bonus.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">Cashier</h1>
          <p className="mt-2 text-white/70">Buy Gold Coin bundles, receive bonus Sweeps Coins, or redeem eligible Sweeps Coin prizes.</p>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3 text-right text-sm">
          <div>Player: {user?.username}</div>
          <div>💜 {user ? user.sweepsCoins.toFixed(2) : '0.00'} SC</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className={`rounded-full px-4 py-2 ${tab === 'buy' ? 'bg-primary' : 'bg-white/5'}`} onClick={() => setTab('buy')}>Buy Gold Coins</button>
        <button className={`rounded-full px-4 py-2 ${tab === 'redeem' ? 'bg-primary' : 'bg-white/5'}`} onClick={() => setTab('redeem')}>Redeem Sweeps Coins</button>
      </div>
      {tab === 'buy' ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {COIN_PACKAGES.map((pkg) => <CoinPackage key={pkg.id} pkg={pkg} onBuy={buyPackage} loading={loadingId === pkg.id} />)}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold">Redeem Sweeps Coins</h2>
          <p className="mt-3 text-white/70">Eligible prize redemption requests are manually reviewed. Contact support after reaching the applicable threshold.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4"><p className="text-white/60">Available SC</p><p className="mt-2 text-3xl font-black text-gold">{user ? user.sweepsCoins.toFixed(2) : '0.00'}</p></div>
            <div className="rounded-2xl bg-white/5 p-4"><p className="text-white/60">Review Window</p><p className="mt-2 text-3xl font-black">24h</p></div>
            <div className="rounded-2xl bg-white/5 p-4"><p className="text-white/60">Payout Type</p><p className="mt-2 text-3xl font-black">Cash App</p></div>
          </div>
        </div>
      )}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold">Cash App Pay</h2>
          <p className="mt-3 text-white/70">Send payment to <span className="font-bold text-gold">$FENCEGUEULLC</span> after generating your request. Match the exact amount shown to speed up confirmation.</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-white/70">
            <li>Select a package.</li>
            <li>Tap the Cash App pay button.</li>
            <li>Complete payment in Cash App and wait for confirmation.</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-emerald-200">SSL Secured</span>
            <span className="rounded-full bg-sky-500/15 px-4 py-2 text-sky-200">Fraud Monitored</span>
            <span className="rounded-full bg-gold/15 px-4 py-2 text-gold">Sweepstakes Compliant</span>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-2xl font-bold">Free Entry</h2>
          <p className="mt-3 text-white/70">No purchase is necessary to participate. Claim your free daily sweeps coin and review the alternative free-entry instructions in the terms.</p>
          <Button className="mt-6 w-full" variant="gold" onClick={claimBonus}>Claim Daily Bonus</Button>
        </div>
      </section>
    </div>
  );
};

export default Cashier;
