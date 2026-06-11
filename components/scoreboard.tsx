"use client";

export interface ScoreboardEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  betsCount: number;
  streak: number;
  completedGroups: string[];
  exactScoreCount: number;
}

interface Props {
  entries: ScoreboardEntry[];
  currentUserId: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Scoreboard({ entries, currentUserId }: Props) {
  const sorted = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="bg-zinc-800/60 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-700/50">
        <h2 className="text-sm font-semibold text-zinc-300">Klasyfikacja</h2>
      </div>
      <div className="divide-y divide-zinc-700/40">
        {sorted.map((entry, i) => {
          const isMe = entry.userId === currentUserId;
          const medal = MEDALS[i] ?? null;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-green-900/20" : ""}`}
            >
              <div className="w-6 text-center shrink-0">
                {medal ? (
                  <span className="text-base leading-none">{medal}</span>
                ) : (
                  <span className="text-xs text-zinc-600 font-medium">{i + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? "text-green-400" : "text-white"}`}>
                  {entry.userName}
                  {isMe && <span className="text-zinc-500 font-normal text-xs ml-1">(ty)</span>}
                </p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <span className="text-xs text-zinc-600">{entry.betsCount} typów</span>
                  {entry.streak >= 3 && (
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
                      🔥 {entry.streak}
                    </span>
                  )}
                  {entry.exactScoreCount > 0 && (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                      🎯 {entry.exactScoreCount}
                    </span>
                  )}
                  {entry.completedGroups.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className={`text-sm font-bold tabular-nums ${
                  i === 0 ? "text-yellow-400" : isMe ? "text-green-400" : "text-white"
                }`}>
                  {entry.totalPoints}
                </p>
                <p className="text-xs text-zinc-600">pkt</p>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-6">Brak punktów</p>
        )}
      </div>
    </div>
  );
}
