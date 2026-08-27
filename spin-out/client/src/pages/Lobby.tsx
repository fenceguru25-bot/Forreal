import { useMemo, useState } from 'react';
import GameCard from '../components/GameCard';
import { casinoGames } from '../lib/data';

const tabs = ['All', 'Slots', 'Table Games', 'Live'];

const Lobby = () => {
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => casinoGames.filter((game) => {
    const matchesTab = tab === 'All' || game.type === tab || game.badge === tab;
    const matchesSearch = game.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  }), [tab, search]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 ${tab === item ? 'bg-primary text-white' : 'bg-white/5 text-white/70'}`}>{item}</button>)}
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search games..." className="rounded-2xl bg-white/5 px-4 py-3 lg:w-80" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((game) => <GameCard key={game.id} game={game} />)}
      </div>
    </div>
  );
};

export default Lobby;
