import { useState } from 'react';
import RouletteWheel from '../components/games/RouletteWheel';
import Button from '../components/ui/Button';
import { useGame } from '../hooks/useGame';
import { useUiStore } from '../store/uiStore';

const chips = [1, 5, 10, 25, 100];
const numbers = Array.from({ length: 37 }, (_, index) => index);

const Roulette = () => {
  const { spinRoulette, validateBet, setBet } = useGame();
  const addToast = useUiStore((state) => state.addToast);
  const [chip, setChip] = useState(5);
  const [selected, setSelected] = useState<number[]>([]);
  const [specialBet, setSpecialBet] = useState<'red' | 'black' | 'even' | 'odd' | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);

  const toggleNumber = (value: number) => setSelected((state) => state.includes(value) ? state.filter((item) => item !== value) : [...state, value]);

  const onSpin = async () => {
    if (selected.length === 0 && !specialBet) {
      addToast({ type: 'error', message: 'Select at least one number or special bet.' });
      return;
    }
    setBet(chip);
    if (!validateBet()) return;
    setSpinning(true);
    try {
      const bets = selected.length > 0
        ? [{ type: 'straight', numbers: selected, amount: chip }]
        : [{ type: specialBet, amount: chip }];
      const response = await spinRoulette(bets);
      setResult(response);
      setHistory((state) => [response.number, ...state].slice(0, 10));
    } catch (error: any) {
      addToast({ type: 'error', message: error?.response?.data?.error ?? 'Roulette spin failed.' });
    } finally {
      setTimeout(() => setSpinning(false), 2800);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black">Roulette Royale</h1>
      <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <div className="glass-card rounded-3xl p-6 text-center">
          <RouletteWheel spinning={spinning} result={result?.number} />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {chips.map((value) => <button key={value} onClick={() => { setChip(value); setBet(value); }} className={`rounded-full px-4 py-2 ${chip === value ? 'bg-gold text-background' : 'bg-white/5'}`}>${value}</button>)}
          </div>
          <Button className="mt-6 w-full" loading={spinning} onClick={onSpin}>Spin Wheel</Button>
          <div className="mt-5 flex justify-center gap-2">
            {history.map((item, index) => <span key={`${item}-${index}`} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${item === 0 ? 'bg-emerald-500' : [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(item) ? 'bg-red-600' : 'bg-slate-900'}`}>{item}</span>)}
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <p className="mb-4 text-white/70">Pick straight-up numbers. Selected numbers are included in the single spin wager.</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(['red', 'black', 'even', 'odd'] as const).map((option) => (
              <button key={option} onClick={() => setSpecialBet(option)} className={`rounded-full px-4 py-2 capitalize ${specialBet === option ? 'bg-primary' : 'bg-white/5'}`}>
                {option}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
            {numbers.map((number) => <button key={number} onClick={() => toggleNumber(number)} className={`rounded-xl px-4 py-3 font-semibold ${selected.includes(number) ? 'bg-primary text-white' : 'bg-white/5'}`}>{number}</button>)}
          </div>
          {result ? <div className="mt-6 rounded-2xl bg-white/5 p-4"><p>Result: <span className="font-bold text-gold">{result.number} {result.color}</span></p><p>Win: <span className="font-bold">${result.winAmount.toFixed(2)}</span></p></div> : null}
        </div>
      </div>
    </div>
  );
};

export default Roulette;
