import GameCard from '@/components/GameCard';

const games = [
  { name: 'Royal Reels', provider: 'Aurora Studios', category: 'Slots' },
  { name: 'Midnight Fortune', provider: 'Aurora Studios', category: 'Slots' },
  { name: 'Golden Joker', provider: 'Luxe Games', category: 'Slots' },
  { name: 'Neon Jackpot', provider: 'Luxe Games', category: 'Slots' },
  { name: 'Blackjack Elite', provider: 'Table Masters', category: 'Blackjack' },
  { name: 'Blackjack Salon', provider: 'Table Masters', category: 'Blackjack' },
  { name: 'Roulette Royale', provider: 'Crown Interactive', category: 'Roulette' },
  { name: 'Roulette Noir', provider: 'Crown Interactive', category: 'Roulette' },
  { name: 'High Stakes Holdem', provider: 'Cardroom X', category: 'Poker' },
  { name: 'Velvet Draw Poker', provider: 'Cardroom X', category: 'Poker' },
  { name: 'Live Baccarat Lounge', provider: 'Studio Prime', category: 'Live Dealer' },
  { name: 'Live Spin Arena', provider: 'Studio Prime', category: 'Live Dealer' },
];

export default function LobbyPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-casino-gold">Game Lobby</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Featured casino floor</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Explore a Phase 1 placeholder catalog across slots, table games, poker, and live dealer categories.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.name} {...game} />
        ))}
      </div>
    </div>
  );
}
