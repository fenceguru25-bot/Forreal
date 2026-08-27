import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="mt-16 border-t border-white/10 bg-card/70">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-2 lg:px-8">
      <div>
        <h3 className="text-2xl font-black text-gold">🎰 Spin Out</h3>
        <p className="mt-3 max-w-xl text-sm text-white/70">Fast, polished sweepstakes gameplay with gold coins, sweeps coins, live leaderboards, and Cash App-ready checkout flows.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
        <Link to="/">About</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/responsible-gaming">Responsible Gaming</Link>
        <a href="mailto:support@spinout.app">Contact</a>
        <span>$FENCEGUEULLC Cash App</span>
      </div>
    </div>
    <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
      Play responsibly. 18+ only. © {new Date().getFullYear()} Spin Out.
    </div>
  </footer>
);

export default Footer;
