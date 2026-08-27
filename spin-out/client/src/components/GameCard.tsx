import { Link } from 'react-router-dom';

const badgeStyles = {
  New: 'bg-sky-500/20 text-sky-200',
  Hot: 'bg-red-500/20 text-red-200',
  Featured: 'bg-gold/20 text-gold',
  Classic: 'bg-white/10 text-white',
  Live: 'bg-emerald-500/20 text-emerald-200',
  VIP: 'bg-violet/20 text-violet-200'
};

const GameCard = ({ game }: { game: { id: string; name: string; type: string; icon: string; badge: string } }) => {
  const href = game.id === 'blackjack' ? '/games/blackjack' : game.id === 'roulette' ? '/games/roulette' : game.id === 'baccarat' ? '/games/baccarat' : `/games/slots/${game.id}`;
  return (
    <Link to={href} className="group glass-card relative overflow-hidden rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-glow">
      <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[game.badge as keyof typeof badgeStyles]}`}>{game.badge}</span>
      <div className="text-5xl">{game.icon}</div>
      <h3 className="mt-4 text-xl font-bold">{game.name}</h3>
      <p className="mt-1 text-sm text-white/60">{game.type}</p>
      <div className="mt-6 opacity-0 transition group-hover:opacity-100">
        <span className="rounded-full bg-gradient-to-r from-primary to-violet px-4 py-2 text-sm font-semibold">Play Now</span>
      </div>
    </Link>
  );
};

export default GameCard;
