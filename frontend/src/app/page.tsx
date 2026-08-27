import Link from 'next/link';

const features = [
  {
    title: 'Dual Currency Wallet',
    description: 'Manage Gold Coins for fun play and Sweeps Coins for promotional prize redemption flows.',
  },
  {
    title: 'Free Entry Paths',
    description: 'Built-in AMOE submission flow supports no-purchase-necessary entry requests.',
  },
  {
    title: 'Responsible Gaming',
    description: 'Self-exclusion, deposit limits, and compliance-focused controls are included from day one.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-10">
      <section className="grid gap-10 rounded-3xl border border-casino-gold/20 bg-white/5 p-8 shadow-glow lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-casino-gold/40 bg-casino-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-casino-gold">
            Sweepstakes Casino Platform
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Play Free. Win Real Prizes.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              ForReal Casino combines social-style gameplay, compliant promotions, and premium dark-luxury presentation in a modern web stack.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth/register"
              className="rounded-full bg-casino-gold px-6 py-3 text-sm font-semibold text-casino-night hover:bg-[#e7bb67]"
            >
              Create Account
            </Link>
            <Link
              href="/lobby"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-casino-gold hover:text-casino-gold"
            >
              Explore Lobby
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {['Welcome Bonus', 'AMOE Entry', 'VIP-Ready Admin Tools', 'Wallet + History'].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-casino-velvet/80 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-casino-gold">ForReal</p>
              <h2 className="mt-3 text-xl font-bold text-white">{item}</h2>
              <p className="mt-2 text-sm text-slate-300">
                Casino-grade UI scaffolding designed for the first product phase.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-casino-velvet/70 p-8 text-sm leading-6 text-slate-300">
        <p className="font-semibold uppercase tracking-[0.25em] text-casino-gold">Legal Disclaimer</p>
        <p className="mt-3">
          No purchase is necessary to participate where permitted. Gold Coins are for entertainment play only. Sweeps Coins are promotional and subject to eligibility, verification, geolocation restrictions, and responsible gaming review.
        </p>
      </section>
    </div>
  );
}
