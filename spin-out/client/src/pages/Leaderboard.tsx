import { useEffect, useState } from 'react';
import LeaderboardList from '../components/Leaderboard';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';

const Leaderboard = () => {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [entries, setEntries] = useState<Array<{ rank: number; username: string; amount: number }>>([]);
  const user = useAuthStore((state) => state.user);
  const { socket, on } = useSocket();

  useEffect(() => {
    api.get(`/leaderboard/${tab}`).then((response) => setEntries(response.data.data)).catch(() => undefined);
  }, [tab]);

  useEffect(() => {
    socket.emit('leaderboard:subscribe');
    return on('leaderboard:update', () => {
      api.get(`/leaderboard/${tab}`).then((response) => setEntries(response.data.data)).catch(() => undefined);
    });
  }, [socket, on, tab]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black">Leaderboard</h1>
        <div className="flex gap-2">
          <button className={`rounded-full px-4 py-2 ${tab === 'daily' ? 'bg-primary' : 'bg-white/5'}`} onClick={() => setTab('daily')}>Daily</button>
          <button className={`rounded-full px-4 py-2 ${tab === 'weekly' ? 'bg-primary' : 'bg-white/5'}`} onClick={() => setTab('weekly')}>Weekly</button>
        </div>
      </div>
      <LeaderboardList entries={entries} highlightUsername={user?.username} />
    </div>
  );
};

export default Leaderboard;
