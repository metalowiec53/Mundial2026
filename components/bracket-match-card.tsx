"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MatchDoc, TeamDoc } from "@/lib/firebase/matches";
import type { BetDoc } from "@/lib/firebase/bets";
import type { OtherBet } from "@/lib/types";
import { saveBetAction } from "@/app/matches/actions";
import { setBoosterAction } from "@/app/booster/actions";

interface TeamSlot {
  team?: TeamDoc;
  label: string;
}

interface Props {
  matchId: string;
  match?: MatchDoc;
  slotA: TeamSlot;
  slotB: TeamSlot;
  bet?: BetDoc;
  otherBets?: OtherBet[];
  myBoosterMatchId: string | null;
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });
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
      className="w-12 h-10 bg-zinc-700/80 text-white text-lg text-center rounded-lg outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-40 placeholder:text-zinc-600 font-bold"
    />
  );
}

function SlotDisplay({ slot }: { slot: TeamSlot }) {
  if (slot.team) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={slot.team.flagUrl}
          alt={slot.team.shortCode}
          width={22}
          height={16}
          className="rounded-sm object-cover shrink-0 shadow-sm"
        />
        <span className="text-white text-sm font-semibold truncate">{slot.team.name}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-[22px] h-[16px] rounded-sm bg-zinc-700/60 shrink-0" />
      <span className="text-zinc-500 text-xs italic truncate">{slot.label}</span>
    </div>
  );
}

export default function BracketMatchCard({
  matchId,
  match,
  slotA,
  slotB,
  bet,
  otherBets,
  myBoosterMatchId,
}: Props) {
  const teamsKnown = !!slotA.team && !!slotB.team;
  const isLocked = match ? new Date(match.kickoff) <= new Date() : !teamsKnown;
  const isFinished = match?.status === "finished";
  const hasBet = bet !== undefined;

  const isThisMatchBoosted = myBoosterMatchId === matchId;
  const boosterUsedElsewhere = myBoosterMatchId !== null && !isThisMatchBoosted;

  const [a, setA] = useState(bet?.scoreA !== undefined ? String(bet.scoreA) : "");
  const [b, setB] = useState(bet?.scoreB !== undefined ? String(bet.scoreB) : "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isBoosterPending, startBoosterTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scoreA = parseInt(a, 10);
    const scoreB = parseInt(b, 10);
    if (isNaN(scoreA) || isNaN(scoreB) || scoreA === scoreB) return;
    setError("");
    startTransition(async () => {
      const result = await saveBetAction(matchId, scoreA, scoreB);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleBoosterToggle() {
    startBoosterTransition(async () => {
      const result = await setBoosterAction(isThisMatchBoosted ? null : matchId);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className={`rounded-xl border ${
      isFinished
        ? "bg-zinc-800/40 border-zinc-700/40"
        : isLocked
        ? "bg-zinc-800/50 border-zinc-700/40"
        : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
    }`}>
      {/* Teams */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-1">
        <div className="flex-1 min-w-0"><SlotDisplay slot={slotA} /></div>

        <div className="shrink-0 w-12 text-center">
          {isFinished && match?.scoreA !== undefined && match?.scoreB !== undefined ? (
            <span className="text-white font-bold text-sm">
              {match.scoreA} : {match.scoreB}
              {match.wentToPenalties && (
                <span className="block text-[9px] text-zinc-500 font-normal">po k.</span>
              )}
            </span>
          ) : (
            <span className="text-zinc-600 text-xs font-medium">vs</span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex justify-end"><SlotDisplay slot={slotB} /></div>
      </div>

      {/* Kickoff */}
      {match && (
        <p className="text-center text-zinc-600 text-[11px] pb-3">
          {formatKickoff(match.kickoff)}
        </p>
      )}

      {/* Divider */}
      <div className="mx-4 h-px bg-zinc-700/50" />

      {/* Bet section */}
      <div className="px-4 py-3">
        {!isLocked && teamsKnown ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <ScoreInput value={a} onChange={setA} disabled={isPending} />
              <span className="text-zinc-500 font-bold text-base shrink-0">:</span>
              <ScoreInput value={b} onChange={setB} disabled={isPending} />
              <button
                type="submit"
                disabled={isPending || a === "" || b === "" || a === b}
                className="flex-1 h-10 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {isPending ? "…" : hasBet ? "Zmień" : "Typuj"}
              </button>
            </div>
            <p className="text-zinc-600 text-[10px] text-center">Remis niedozwolony</p>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          </form>
        ) : (
          <div className="flex items-center justify-between min-h-[40px]">
            {!teamsKnown ? (
              <span className="text-zinc-600 text-xs w-full text-center">
                Pary zostaną ogłoszone po fazie grupowej
              </span>
            ) : hasBet ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs">Twój typ</span>
                  <span className="text-white font-bold text-sm">
                    {bet.scoreA} : {bet.scoreB}
                  </span>
                  {isThisMatchBoosted && !isFinished && (
                    <span className="text-amber-400 text-xs font-bold">⚡ x2</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {bet.points !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      bet.points > 0
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-zinc-700/60 text-zinc-500 border-zinc-700"
                    }`}>
                      +{bet.points}
                    </span>
                  )}
                  <span className="text-zinc-700 text-sm">🔒</span>
                </div>
              </>
            ) : (
              <span className="text-zinc-600 text-sm w-full text-center">Brak typowania</span>
            )}
          </div>
        )}
      </div>

      {/* Booster toggle — only before match starts */}
      {!isLocked && teamsKnown && (
        <>
          <div className="mx-4 h-px bg-zinc-700/40" />
          <div className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500">Doładowanie x2</span>
              {boosterUsedElsewhere && (
                <span className="text-[10px] text-zinc-600">(użyte na innym meczu)</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleBoosterToggle}
              disabled={isBoosterPending || boosterUsedElsewhere}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isThisMatchBoosted
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-zinc-700/60 text-zinc-400 border border-zinc-600 hover:bg-zinc-700"
              }`}
            >
              ⚡ {isThisMatchBoosted ? "Aktywne" : "Użyj"}
            </button>
          </div>
        </>
      )}

      {/* Booster indicator when match locked but booster was applied */}
      {isLocked && isThisMatchBoosted && !isFinished && (
        <>
          <div className="mx-4 h-px bg-zinc-700/40" />
          <div className="px-4 py-2 text-center">
            <span className="text-xs text-amber-400 font-bold">⚡ Doładowanie aktywne</span>
          </div>
        </>
      )}

      {/* Other players — visible after kickoff */}
      {isLocked && teamsKnown && otherBets && otherBets.length > 0 && (
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
                  {ob.points !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      ob.points > 0
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-zinc-700/60 text-zinc-500 border-zinc-700"
                    }`}>
                      +{ob.points}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
