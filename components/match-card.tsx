"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MatchDoc, TeamDoc } from "@/lib/firebase/matches";
import type { BetDoc } from "@/lib/firebase/bets";
import { saveBetAction } from "@/app/matches/actions";
import type { OtherBet } from "@/lib/types";

interface Props {
  match: MatchDoc;
  teamA: TeamDoc;
  teamB: TeamDoc;
  bet?: BetDoc;
  otherBets?: OtherBet[];
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Warsaw",
  });
  const time = d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
    hour12: false,
  });
  return `${date}, ${time}`;
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      step={1}
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="–"
      className="w-12 h-10 bg-zinc-700/80 text-white text-lg text-center rounded-lg outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-40 placeholder:text-zinc-600 font-bold"
    />
  );
}

function PointsBadge({ points }: { points: number }) {
  if (points === 5)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        +5
      </span>
    );
  if (points === 3)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
        +3
      </span>
    );
  if (points === 1)
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
        +1
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-700/60 text-zinc-500 border border-zinc-700">
      +0
    </span>
  );
}

export default function MatchCard({ match, teamA, teamB, bet, otherBets }: Props) {
  const isLocked = new Date(match.kickoff) <= new Date();
  const isFinished = match.status === "finished";

  const [a, setA] = useState(bet?.scoreA !== undefined ? String(bet.scoreA) : "");
  const [b, setB] = useState(bet?.scoreB !== undefined ? String(bet.scoreB) : "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync inputs when the server bet prop updates (e.g. after router.refresh() completes
  // while the component was already mounted from a group switch)
  useEffect(() => {
    if (bet?.scoreA !== undefined) setA(String(bet.scoreA));
    if (bet?.scoreB !== undefined) setB(String(bet.scoreB));
  }, [bet?.scoreA, bet?.scoreB]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scoreA = parseInt(a, 10);
    const scoreB = parseInt(b, 10);
    if (isNaN(scoreA) || isNaN(scoreB)) return;

    setError("");
    startTransition(async () => {
      const result = await saveBetAction(match.id, scoreA, scoreB);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const hasBet = bet !== undefined;
  const resultLabel = isFinished && match.scoreA !== undefined && match.scoreB !== undefined
    ? `${match.scoreA} : ${match.scoreB}`
    : null;

  return (
    <div className={`rounded-xl border transition-colors ${
      isFinished
        ? "bg-zinc-800/40 border-zinc-700/40"
        : isLocked
        ? "bg-zinc-800/60 border-zinc-700/50"
        : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
    }`}>
      {/* Teams row */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-1">
        {/* Team A */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={teamA.flagUrl}
            alt={teamA.shortCode}
            width={24}
            height={17}
            className="rounded-sm object-cover shrink-0 shadow-sm"
          />
          <span className="text-white text-sm font-semibold truncate">{teamA.name}</span>
        </div>

        {/* Score / vs */}
        <div className="shrink-0 w-14 text-center">
          {resultLabel ? (
            <span className="text-white font-bold text-sm">{resultLabel}</span>
          ) : (
            <span className="text-zinc-600 text-xs font-medium">vs</span>
          )}
        </div>

        {/* Team B */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-white text-sm font-semibold truncate text-right">{teamB.name}</span>
          <img
            src={teamB.flagUrl}
            alt={teamB.shortCode}
            width={24}
            height={17}
            className="rounded-sm object-cover shrink-0 shadow-sm"
          />
        </div>
      </div>

      {/* Kickoff */}
      <p className="text-center text-zinc-600 text-[11px] pb-3">
        {formatKickoff(match.kickoff)}
      </p>

      {/* Divider */}
      <div className="mx-4 h-px bg-zinc-700/50" />

      {/* Bet section */}
      <div className="px-4 py-3">
        {!isLocked ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <ScoreInput value={a} onChange={setA} disabled={isPending} />
              <span className="text-zinc-500 font-bold text-base shrink-0">:</span>
              <ScoreInput value={b} onChange={setB} disabled={isPending} />
              <button
                type="submit"
                disabled={isPending || a === "" || b === ""}
                className="flex-1 h-10 bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {isPending ? "…" : hasBet ? "Zmień" : "Typuj"}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs text-center mt-2">{error}</p>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-between min-h-[40px]">
            {hasBet ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs">Twój typ</span>
                  <span className="text-white font-bold text-sm">
                    {bet.scoreA} : {bet.scoreB}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {bet.points !== undefined && <PointsBadge points={bet.points} />}
                  <span className="text-zinc-700 text-sm">🔒</span>
                </div>
              </>
            ) : (
              <span className="text-zinc-600 text-sm w-full text-center">Brak typowania</span>
            )}
          </div>
        )}
      </div>

      {/* Other players' bets — visible only after kickoff */}
      {isLocked && otherBets && otherBets.length > 0 && (
        <>
          <div className="mx-4 h-px bg-zinc-700/40" />
          <div className="px-4 py-3 space-y-1.5">
            {otherBets.map((ob) => (
              <div key={ob.userName} className="flex items-center justify-between">
                <span className="text-zinc-500 text-xs truncate max-w-[120px]">{ob.userName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300 text-xs font-semibold tabular-nums">
                    {ob.scoreA} : {ob.scoreB}
                  </span>
                  {ob.points !== undefined && <PointsBadge points={ob.points} />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
