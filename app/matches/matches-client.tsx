"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchDoc, TeamDoc } from "@/lib/firebase/matches";
import type { BetDoc } from "@/lib/firebase/bets";
import MatchCard from "@/components/match-card";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

interface Props {
  matches: MatchDoc[];
  teams: Record<string, TeamDoc>;
  bets: Record<string, BetDoc>;
}

export default function MatchesClient({ matches, teams, bets }: Props) {
  const [activeGroup, setActiveGroup] = useState<string>("A");

  const groupMatches = matches.filter((m) => m.groupId === activeGroup);

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <Link
          href="/"
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          ← Główna
        </Link>
        <h1 className="text-base font-semibold">Mecze grupowe</h1>
        <div className="w-16" />
      </header>

      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto border-b border-zinc-800">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`flex-shrink-0 w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
              activeGroup === g
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {groupMatches.map((match) => {
          const teamA = teams[match.teamAId];
          const teamB = teams[match.teamBId];
          if (!teamA || !teamB) return null;
          return (
            <MatchCard
              key={match.id}
              match={match}
              teamA={teamA}
              teamB={teamB}
              bet={bets[match.id]}
            />
          );
        })}
      </div>
    </div>
  );
}
