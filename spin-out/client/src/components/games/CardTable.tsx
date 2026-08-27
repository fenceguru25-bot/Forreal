import type { Card } from '../../../../shared/src/types';

const PlayingCard = ({ card }: { card: Card }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div className="card-flip flex h-32 w-24 flex-col justify-between rounded-2xl bg-white p-3 text-background shadow-xl">
      <span className={isRed ? 'text-red-500' : 'text-black'}>{card.value}</span>
      <span className={`self-center text-3xl ${isRed ? 'text-red-500' : 'text-black'}`}>{card.suit}</span>
      <span className={`self-end ${isRed ? 'text-red-500' : 'text-black'}`}>{card.value}</span>
    </div>
  );
};

const CardTable = ({ title, hand, score }: { title: string; hand: Card[]; score: number }) => (
  <div className="rounded-3xl border border-white/10 bg-emerald-900/70 p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-xl font-bold">{title}</h3>
      <span className="rounded-full bg-white/10 px-3 py-1 text-sm">Score: {score}</span>
    </div>
    <div className="flex flex-wrap gap-3">
      {hand.map((card, index) => <PlayingCard key={`${card.suit}-${card.value}-${index}`} card={card} />)}
    </div>
    {score === 21 ? <p className="mt-3 text-gold">Blackjack!</p> : null}
    {score > 21 ? <p className="mt-3 text-red-300">Bust</p> : null}
  </div>
);

export default CardTable;
