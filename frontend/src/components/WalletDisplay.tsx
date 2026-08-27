interface WalletDisplayProps {
  gcBalance: number;
  scBalance: number;
  compact?: boolean;
}

export default function WalletDisplay({ gcBalance, scBalance, compact = false }: WalletDisplayProps) {
  return (
    <div className={`flex ${compact ? 'flex-row gap-3' : 'flex-col gap-4 sm:flex-row'} rounded-2xl border border-casino-gold/20 bg-casino-velvet/80 p-4`}>
      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
        <span className="text-lg">🪙</span>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Gold Coins</p>
          <p className="text-lg font-semibold text-white">{gcBalance.toLocaleString()} GC</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
        <span className="text-lg">💠</span>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sweeps Coins</p>
          <p className="text-lg font-semibold text-white">{scBalance.toLocaleString()} SC</p>
        </div>
      </div>
    </div>
  );
}
