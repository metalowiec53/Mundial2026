"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamDoc } from "@/lib/firebase/matches";
import type { SpecialBetDoc } from "@/lib/firebase/special-bets";
import { saveChampionBetAction } from "@/app/special-bets/actions";

export interface OtherSpecialBet {
  userName: string;
  teamId: string;
  teamName: string;
  flagUrl: string;
  points?: number;
}

interface Props {
  teams: TeamDoc[];
  myBet?: SpecialBetDoc;
  otherBets: OtherSpecialBet[];
  isLocked: boolean;
}

export default function SpecialBetsPanel({ teams, myBet, otherBets, isLocked }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId) return;
    setError("");
    startTransition(async () => {
      const result = await saveChampionBetAction(selectedTeamId);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name, "pl"));

  return (
    <div className="bg-zinc-800/60 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-700/50">
        <h2 className="text-sm font-semibold text-zinc-300">Typy specjalne</h2>
      </div>

      {/* Champion section */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white">Zwycięzca mundialu</p>
          <span className="text-xs text-yellow-500 font-bold">+10 pkt</span>
        </div>

        {myBet ? (
          /* Already submitted */
          <div className="flex items-center gap-2 bg-zinc-700/40 rounded-xl px-3 py-2.5">
            <img
              src={myBet.flagUrl}
              alt={myBet.teamId}
              width={22}
              height={16}
              className="rounded-sm object-cover shrink-0"
            />
            <span className="text-white text-sm font-semibold flex-1 truncate">
              {myBet.teamName}
            </span>
            {myBet.points !== undefined ? (
              <span className="text-yellow-400 text-xs font-bold">+{myBet.points} pkt</span>
            ) : (
              <span className="text-zinc-600 text-xs">🔒</span>
            )}
          </div>
        ) : isLocked ? (
          <p className="text-zinc-600 text-xs text-center py-1">Nie obstawiłeś</p>
        ) : (
          /* Betting form */
          <form onSubmit={handleSubmit} className="space-y-2">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={isPending}
              className="w-full bg-zinc-700/80 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-40 appearance-none"
            >
              <option value="" disabled>Wybierz drużynę…</option>
              {sortedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending || !selectedTeamId}
              className="w-full h-9 bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {isPending ? "…" : "Typuj"}
            </button>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <p className="text-zinc-600 text-[10px] text-center leading-tight">
              Jednorazowe — po oddaniu nie można zmienić
            </p>
          </form>
        )}

        {/* Other players' picks — visible only after kickoff */}
        {isLocked && otherBets.length > 0 && (
          <div className="mt-1 space-y-1.5 pt-3 border-t border-zinc-700/40">
            {otherBets.map((ob) => (
              <div key={ob.userName} className="flex items-center gap-2">
                <img
                  src={ob.flagUrl}
                  alt={ob.teamId}
                  width={18}
                  height={13}
                  className="rounded-sm object-cover shrink-0"
                />
                <span className="text-zinc-500 text-xs truncate flex-1">{ob.userName}</span>
                <span className="text-zinc-300 text-xs font-semibold truncate max-w-[70px] text-right">
                  {ob.teamName}
                </span>
                {ob.points !== undefined && (
                  <span className="text-yellow-400 text-xs font-bold shrink-0">
                    +{ob.points}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
