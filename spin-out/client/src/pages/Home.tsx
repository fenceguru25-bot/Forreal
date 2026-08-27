import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import GameCard from '../components/GameCard';
import { casinoGames } from '../lib/data';
import { useUiStore } from '../store/uiStore';

const Home = () => {
  const openAuthModal = useUiStore((state) => state.openAuthModal);

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="inline-flex rounded-full bg-gold/15 px-4 py-2 text-sm font-semibold text-gold">No Purchase Necessary</span>
          <h1 className="mt-6 text-5xl font-black leading-tight lg:text-7xl">Sweepstakes thrills that spin fast, look premium, and cash out clean.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">Spin Out brings together social casino polish, sweepstakes compliance messaging, real-time tables, and Cash App-ready coin packages in one dark-mode experience.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" onClick={() => openAuthModal('register')}>Play Now</Button>
            <Link to="/lobby"><Button size="lg" variant="ghost">Browse Games</Button></Link>
          </div>
        </div>
        <div className="glass-card rounded-[2rem] p-8 shadow-glow">
          <div className="grid grid-cols-3 gap-3 text-center text-5xl">
            {['🍒','7️⃣','💎','🎰','⭐','🃏','🍋','🔔','🍇'].map((icon) => <div key={icon} className="reel-symbol spin-animation">{icon}</div>)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-card p-6 text-center md:grid-cols-3">
        <div><p className="text-3xl font-black text-gold">50,000+</p><p className="text-white/70">Players</p></div>
        <div><p className="text-3xl font-black text-gold">Daily</p><p className="text-white/70">Jackpots</p></div>
        <div><p className="text-3xl font-black text-gold">Instant</p><p className="text-white/70">Payouts</p></div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between"><h2 className="text-3xl font-bold">Featured Games</h2><Link to="/lobby" className="text-gold">See all</Link></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{casinoGames.map((game) => <GameCard key={game.id} game={game} />)}</div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          ['1', 'Get Coins', 'Claim your free daily sweeps coin or pick up a Cash App coin bundle.'],
          ['2', 'Play Games', 'Jump into polished slots, blackjack, roulette, and baccarat.'],
          ['3', 'Win Prizes', 'Collect sweeps coin wins, climb leaderboards, and redeem where allowed.']
        ].map(([step, title, description]) => (
          <div key={step} className="glass-card rounded-3xl p-6">
            <span className="text-sm font-bold text-gold">STEP {step}</span>
            <h3 className="mt-3 text-2xl font-bold">{title}</h3>
            <p className="mt-3 text-white/70">{description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-gold/20 bg-gold/10 p-6 text-center text-white/80">
        Sweepstakes play uses Gold Coins for entertainment and Sweeps Coins for eligible prize promotions. Alternate free-entry methods are always available.
      </section>

      <section className="glass-card rounded-3xl p-8 lg:flex lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Cash App Featured</p>
          <h2 className="mt-3 text-3xl font-black">Fast checkout with $FENCEGUEULLC</h2>
          <p className="mt-3 max-w-2xl text-white/70">Pick a package, generate a payment request, and complete the purchase using Cash App in a few taps.</p>
        </div>
        <Link to="/cashier" className="mt-6 inline-block lg:mt-0"><Button variant="gold" size="lg">Open Cashier</Button></Link>
      </section>
    </div>
  );
};

export default Home;
