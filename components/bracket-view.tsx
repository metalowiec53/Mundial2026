"use client";

import { BRACKET, STAGE_LABELS, STAGE_ORDER } from "@/lib/bracket";
import type { MatchDoc, TeamDoc } from "@/lib/firebase/matches";
import type { BetDoc } from "@/lib/firebase/bets";
import type { OtherBet } from "@/lib/types";
import BracketMatchCard from "@/components/bracket-match-card";

interface Props {
  knockoutMatches: MatchDoc[];
  teamsMap: Record<string, TeamDoc>;
  bets: Record<string, BetDoc>;
  otherBetsMap: Record<string, OtherBet[]>;
}

export default function BracketView({ knockoutMatches, teamsMap, bets, otherBetsMap }: Props) {
  const matchById = Object.fromEntries(knockoutMatches.map((m) => [m.id, m]));

  const byStage = Object.fromEntries(
    STAGE_ORDER.map((stage) => [stage, BRACKET.filter((b) => b.stage === stage)])
  );

  return (
    <div className="space-y-8">
      {STAGE_ORDER.map((stage) => {
        const defs = byStage[stage];
        if (!defs.length) return null;

        const isFinal = stage === "final" || stage === "3rd";

        return (
          <section key={stage}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
              {STAGE_LABELS[stage]}
            </h3>
            <div className={`grid gap-3 ${isFinal ? "grid-cols-1 max-w-sm" : "grid-cols-1 sm:grid-cols-2"}`}>
              {defs.map((def) => {
                const match = matchById[def.id];
                const teamA = match ? teamsMap[match.teamAId] : undefined;
                const teamB = match ? teamsMap[match.teamBId] : undefined;
                return (
                  <BracketMatchCard
                    key={def.id}
                    matchId={def.id}
                    match={match}
                    slotA={{ team: teamA, label: def.slotA.label }}
                    slotB={{ team: teamB, label: def.slotB.label }}
                    bet={bets[def.id]}
                    otherBets={otherBetsMap[def.id]}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
