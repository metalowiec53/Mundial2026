"use client";

import type { MatchDoc, TeamDoc } from "@/lib/firebase/matches";
import type { BetDoc } from "@/lib/firebase/bets";

interface Props {
  match: MatchDoc | null;
  teamA?: TeamDoc;
  teamB?: TeamDoc;
  bet?: BetDoc;
  onGroupSelect: (group: string) => void;
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 1000 / 60 / 60);
  const diffM = Math.floor((diffMs / 1000 / 60) % 60);

  let when: string;
  if (diffH < 1) {
    when = `za ${diffM} min`;
  } else if (diffH < 24) {
    when = `za ${diffH} godz ${diffM} min`;
  } else {
    when = d.toLocaleDateString("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Europe/Warsaw",
    });
  }

  const time = d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
    hour12: false,
  });

  return `${when}, ${time}`;
}

export default function NextMatchPanel({ match, teamA, teamB, bet, onGroupSelect }: Props) {
  if (!match || !teamA || !teamB) {
    return (
      <div className="bg-zinc-800/60 rounded-2xl px-4 py-5 text-center">
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">
          Następny mecz
        </p>
        <p className="text-zinc-600 text-sm">Brak nadchodzących meczów</p>
      </div>
    );
  }

  const hasBet = bet !== undefined;

  return (
    <button
      onClick={() => onGroupSelect(match.groupId ?? "")}
      className="w-full bg-zinc-800/60 hover:bg-zinc-800 rounded-2xl px-4 py-4 text-left transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">
          Następny mecz
        </p>
        <span className="text-xs text-zinc-600 bg-zinc-700/60 px-2 py-0.5 rounded-full font-medium">
          Gr. {match.groupId}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <img
            src={teamA.flagUrl}
            alt={teamA.shortCode}
            width={22}
            height={16}
            className="rounded-sm object-cover shrink-0"
          />
          <span className="text-white text-sm font-semibold truncate">{teamA.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src={teamB.flagUrl}
            alt={teamB.shortCode}
            width={22}
            height={16}
            className="rounded-sm object-cover shrink-0"
          />
          <span className="text-white text-sm font-semibold truncate">{teamB.name}</span>
        </div>
      </div>

      {/* Kickoff */}
      <p className="text-xs text-zinc-500 mb-3">{formatKickoff(match.kickoff)}</p>

      {/* Bet status + CTA */}
      <div className="flex items-center justify-between">
        {hasBet ? (
          <span className="text-xs text-green-400 font-medium">
            Typ: {bet.scoreA} : {bet.scoreB}
          </span>
        ) : (
          <span className="text-xs text-yellow-500 font-medium">Brak typowania</span>
        )}
        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
          Idź →
        </span>
      </div>
    </button>
  );
}
