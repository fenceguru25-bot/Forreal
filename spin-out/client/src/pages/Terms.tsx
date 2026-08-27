const sections = [
  ['Official Sweepstakes Rules', 'Spin Out is a promotional sweepstakes casino experience. Gold Coins are provided for entertainment play. Sweeps Coins are promotional entries for eligible prize redemptions, subject to verification, limits, and these official rules.'],
  ['No Purchase Necessary', 'No purchase is necessary to open an account, claim the daily bonus, or request the free alternate method of entry described below. A purchase does not improve your chances of winning.'],
  ['Eligibility', 'Open only to legal residents of the United States who are at least 18 years old and located outside restricted states, including Washington, Idaho, Michigan, Nevada, Kentucky, and Arkansas.'],
  ['How to Enter', 'Players may enter by using awarded Sweeps Coins from daily bonuses, promotional events, or approved free-entry requests. Purchases of Gold Coin packages may include bonus Sweeps Coins where permitted.'],
  ['Prize Descriptions', 'Sweeps Coin wins may be eligible for cash-equivalent redemption where legally available, subject to identity verification, fraud review, and minimum redemption thresholds posted by the operator.'],
  ['Odds of Winning', 'Odds depend on the number of eligible entries and the rules of each game engine. Past results do not influence future outcomes. Game outcomes are governed by the published software logic and randomization methods.'],
  ['Prize Redemption', 'Redemptions may require government-issued identification, proof of residence, age verification, and confirmation that the account is in good standing. Invalid or fraudulent requests may be denied.'],
  ['Sponsor Info', 'Spin Out is operated by its sponsor and promotional administrator. Contact support@spinout.app for questions about entries, promotions, or compliance matters.']
];

const Terms = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-4xl font-black">Terms & Conditions</h1>
      <p className="mt-3 text-white/70">Please read these sweepstakes rules carefully before participating in any promotional gameplay or prize redemption activity.</p>
    </div>
    {sections.map(([title, description]) => (
      <section key={title} className="glass-card rounded-3xl p-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-3 text-white/75">{description}</p>
      </section>
    ))}
  </div>
);

export default Terms;
