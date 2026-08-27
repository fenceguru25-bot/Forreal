import Button from './ui/Button';

const CoinPackage = ({
  pkg,
  onBuy,
  loading
}: {
  pkg: { id: string; name: string; goldCoins: number; sweepsCoins: number; price: number; popular: boolean };
  onBuy: (pkgId: string, amount: number) => void;
  loading?: boolean;
}) => (
  <div className={`glass-card relative rounded-3xl p-6 ${pkg.popular ? 'border border-gold shadow-glow' : ''}`}>
    {pkg.popular ? <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-background">Most Popular</span> : null}
    <h3 className="text-2xl font-bold">{pkg.name}</h3>
    <p className="mt-4 text-4xl font-black">${pkg.price.toFixed(2)}</p>
    <div className="mt-5 space-y-2 text-white/75">
      <p>🟡 {pkg.goldCoins.toLocaleString()} Gold Coins</p>
      <p>💜 {pkg.sweepsCoins.toLocaleString()} Sweeps Coins</p>
    </div>
    <Button variant="gold" className="mt-6 w-full" loading={loading} onClick={() => onBuy(pkg.id, pkg.price)}>Pay with Cash App</Button>
  </div>
);

export default CoinPackage;
