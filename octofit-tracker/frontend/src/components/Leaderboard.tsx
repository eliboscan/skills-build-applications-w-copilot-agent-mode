import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard?: LeaderboardEntry[] };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      emptyMessage="No leaderboard scores yet."
      isEmpty={(data) => !data.leaderboard?.length}
      renderData={(data) => (
        <ol className="list-group list-group-numbered list-group-flush">
          {data.leaderboard?.map((entry) => (
            <li className="list-group-item d-flex justify-content-between px-0" key={entry.teamName}>
              <span>{entry.teamName} <span className="text-body-secondary">(rank {entry.rank})</span></span>
              <strong>{entry.totalPoints} points</strong>
            </li>
          ))}
        </ol>
      )}
    />
  );
}
