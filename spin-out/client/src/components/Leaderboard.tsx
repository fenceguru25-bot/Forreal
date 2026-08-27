const LeaderboardList = ({ entries, highlightUsername }: { entries: Array<{ rank: number; username: string; amount: number }>; highlightUsername?: string }) => (
  <div className="space-y-3">
    {entries.map((entry) => (
      <div key={`${entry.rank}-${entry.username}`} className={`glass-card flex items-center justify-between rounded-2xl p-4 ${highlightUsername === entry.username ? 'border border-gold' : ''}`}>
        <div className="flex items-center gap-4">
          <span className="text-xl">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}</span>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet font-bold">{entry.username.slice(0, 1).toUpperCase()}</div>
          <span className="font-semibold">{entry.username}</span>
        </div>
        <span className="font-bold text-gold">${entry.amount.toFixed(2)}</span>
      </div>
    ))}
  </div>
);

export default LeaderboardList;
