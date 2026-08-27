import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import SlotReels from '../components/games/SlotReels';
import WinAnimation from '../components/games/WinAnimation';
import Button from '../components/ui/Button';
import { useGame } from '../hooks/useGame';
import { useUiStore } from '../store/uiStore';

const titles = {
  'lucky-sevens': 'Lucky Sevens',
  'fruit-frenzy': 'Fruit Frenzy',
  'diamond-rush': 'Diamond Rush',
  'wild-west': 'Wild West',
  'cosmic-spin': 'Cosmic Spin',
  'gold-rush': 'Gold Rush'
};
const bets = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100];

const SlotGame = () => {
  const { gameId = 'lucky-sevens' } = useParams();
  const { betAmount, setBet, currency, setCurrency, isSpinning, spinSlots, lastResult, validateBet } = useGame();
  const addToast = useUiStore((state) => state.addToast);
  const [nonce, setNonce] = useState(0);
  const [history, setHistory] = useState<Array<{ win: number; multiplier: number }>>([]);
  const [showWin, setShowWin] = useState(false);

  const reels = useMemo(() => lastResult?.reels ?? Array.from({ length: 3 }, () => ['🍒', '🍋', '💎', '7️⃣', '🔔']), [lastResult]);

  useEffect(() => {
    if (lastResult?.winAmount > 0) {
      setHistory((current) => [{ win: lastResult.winAmount, multiplier: lastResult.multiplier }, ...current].slice(0, 10));
      setShowWin(true);
    }
  }, [lastResult]);

  const onSpin = async () => {
    if (!validateBet()) return;
    try {
      await spinSlots({ clientSeed: gameId, nonce });
      setNonce((value) => value + 1);
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Spin failed.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-black">{titles[gameId] ?? 'Slot Game'}</h1>
            <p className="mt-2 text-white/70">5 reels, 5 paylines, wilds, scatters, and free spins.</p>
          </div>
          <SlotReels reels={reels} isSpinning={isSpinning} winningPaylines={lastResult?.paylines ?? []} />
          <div className="glass-card flex flex-wrap items-center gap-3 rounded-3xl p-4">
            {bets.map((value) => <button key={value} onClick={() => setBet(value)} className={`rounded-xl px-3 py-2 ${betAmount === value ? 'bg-gold text-background' : 'bg-white/5 text-white'}`}>${value}</button>)}
            <div className="ml-auto flex gap-2">
              {['GC', 'SC'].map((value) => <button key={value} onClick={() => setCurrency(value as 'SC' | 'GC')} className={`rounded-xl px-4 py-2 ${currency === value ? 'bg-primary' : 'bg-white/5'}`}>{value}</button>)}
            </div>
            <Button className="ml-auto" size="lg" loading={isSpinning} onClick={onSpin}>Spin</Button>
          </div>
        </div>
        <aside className="w-full max-w-md space-y-6">
          <div className="glass-card rounded-3xl p-5">
            <h2 className="text-xl font-bold">Result</h2>
            <p className="mt-3 text-white/70">Win Amount</p>
            <p className="text-4xl font-black text-gold">${(lastResult?.winAmount ?? 0).toFixed(2)}</p>
            <p className="mt-3 text-white/70">Free Spins: {lastResult?.freeSpins ?? 0}</p>
            <p className="text-white/70">Multiplier: {lastResult?.multiplier ?? 0}x</p>
          </div>
          <div className="glass-card rounded-3xl p-5">
            <h2 className="text-xl font-bold">Last 10 Spins</h2>
            <div className="mt-4 space-y-3">
              {history.length === 0 ? <p className="text-white/60">Spin to build your history.</p> : history.map((entry, index) => <div key={`${entry.win}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"><span>Spin #{history.length - index}</span><span className="text-gold">${entry.win.toFixed(2)} · {entry.multiplier}x</span></div>)}
            </div>
          </div>
        </aside>
      </div>
      {showWin && lastResult?.winAmount > 0 ? <WinAnimation amount={lastResult.winAmount} multiplier={Math.max(1, lastResult.multiplier)} onClose={() => setShowWin(false)} /> : null}
    </div>
  );
};

export default SlotGame;
