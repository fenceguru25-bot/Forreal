import { useState } from 'react';
import CardTable from '../components/games/CardTable';
import Button from '../components/ui/Button';
import { useGame } from '../hooks/useGame';
import { useUiStore } from '../store/uiStore';

const Baccarat = () => {
  const { betAmount, setBet, dealBaccarat, lastResult, validateBet } = useGame();
  const addToast = useUiStore((state) => state.addToast);
  const [choice, setChoice] = useState<'player' | 'banker' | 'tie'>('player');

  const play = async () => {
    if (!validateBet()) return;
    try {
      await dealBaccarat(choice);
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Baccarat hand failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Baccarat VIP</h1>
      <div className="glass-card rounded-3xl p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {[1, 5, 10, 25, 50, 100].map((bet) => <button key={bet} onClick={() => setBet(bet)} className={`rounded-xl px-4 py-2 ${betAmount === bet ? 'bg-gold text-background' : 'bg-white/5'}`}>${bet}</button>)}
          {(['player', 'banker', 'tie'] as const).map((option) => <button key={option} onClick={() => setChoice(option)} className={`rounded-xl px-4 py-2 capitalize ${choice === option ? 'bg-primary' : 'bg-white/5'}`}>{option}</button>)}
          <Button onClick={play}>Deal</Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardTable title="Player" hand={lastResult?.playerHand ?? []} score={(lastResult?.playerHand ?? []).reduce((sum, card) => sum + card.numericValue, 0) % 10} />
          <CardTable title="Banker" hand={lastResult?.bankerHand ?? []} score={(lastResult?.bankerHand ?? []).reduce((sum, card) => sum + card.numericValue, 0) % 10} />
        </div>
        <p className="mt-4 text-sm text-white/70">Banker wins pay 1:1 minus a standard 5% commission, reflected by a 1.95x payout.</p>
        {lastResult ? <div className="mt-6 rounded-2xl bg-white/5 p-4 text-center"><p className="text-gold">Winner: {lastResult.winner}</p><p>Payout: ${lastResult.payout.toFixed(2)}</p></div> : null}
      </div>
    </div>
  );
};

export default Baccarat;
