import Button from '../components/ui/Button';
import CardTable from '../components/games/CardTable';
import { useGame } from '../hooks/useGame';
import { useUiStore } from '../store/uiStore';

const Blackjack = () => {
  const { betAmount, setBet, blackjackAction, lastResult, validateBet } = useGame();
  const addToast = useUiStore((state) => state.addToast);

  const perform = async (action: 'start' | 'hit' | 'stand' | 'double') => {
    if (action === 'start' && !validateBet()) return;
    try {
      await blackjackAction(action);
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Blackjack request failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Blackjack Deluxe</h1>
      <div className="glass-card rounded-3xl p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {[1, 5, 10, 25, 50, 100].map((bet) => <button key={bet} onClick={() => setBet(bet)} className={`rounded-xl px-4 py-2 ${betAmount === bet ? 'bg-gold text-background' : 'bg-white/5'}`}>${bet}</button>)}
          <Button onClick={() => perform('start')}>Deal</Button>
        </div>
        <div className="space-y-6">
          <CardTable title="Dealer" hand={lastResult?.dealerHand ?? []} score={lastResult?.dealerScore ?? 0} />
          <CardTable title="Player" hand={lastResult?.playerHand ?? []} score={lastResult?.playerScore ?? 0} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => perform('hit')}>Hit</Button>
          <Button variant="secondary" onClick={() => perform('stand')}>Stand</Button>
          <Button variant="gold" onClick={() => perform('double')}>Double</Button>
          <Button variant="ghost" disabled>Split</Button>
        </div>
        {lastResult?.status && lastResult.status !== 'playing' ? <div className="mt-6 rounded-2xl bg-white/5 p-4 text-center text-2xl font-black text-gold">{lastResult.status.replaceAll('_', ' ').toUpperCase()}</div> : null}
      </div>
    </div>
  );
};

export default Blackjack;
