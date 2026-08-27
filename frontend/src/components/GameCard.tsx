interface GameCardProps {
  name: string;
  provider: string;
  category: string;
}

export default function GameCard({ name, provider, category }: GameCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-glow transition hover:-translate-y-1 hover:border-casino-gold/40">
      <div className="h-44 bg-[linear-gradient(135deg,rgba(214,166,76,0.45),rgba(39,21,82,0.95),rgba(7,11,26,1))]" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{name}</h2>
            <p className="mt-1 text-sm text-slate-300">{provider}</p>
          </div>
          <span className="rounded-full border border-casino-gold/30 bg-casino-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-casino-gold">
            {category}
          </span>
        </div>
        <button className="w-full rounded-xl bg-casino-gold px-4 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67]">
          Play Now
        </button>
      </div>
    </article>
  );
}
