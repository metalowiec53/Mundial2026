"use client";

import { useMemo } from "react";
import { BRACKET } from "@/lib/bracket";
import type { MatchDoc } from "@/lib/firebase/matches";

interface Props {
  matches: MatchDoc[];
}

interface Milestone {
  label: string;
  at: number;
  pct: number;
  reached: boolean;
  above: boolean;
}

export default function TournamentProgress({ matches }: Props) {
  const { progressPct, milestones, finished, total } = useMemo(() => {
    const finished = matches.filter((m) => m.status === "finished").length;

    // Group matches come from Firestore; knockout matches from the static BRACKET definition
    // (knockout docs don't exist in Firestore until the bracket is populated)
    const g = matches.filter((m) => m.stage === "group").length;
    if (g === 0) return { progressPct: 0, milestones: [] as Milestone[], finished: 0, total: 0 };

    const bcnt = (stage: string) => BRACKET.filter((m) => m.stage === stage).length;
    const r32   = bcnt("R32");   // 16
    const r16   = bcnt("R16");   // 8
    const qf    = bcnt("QF");    // 4
    const sf    = bcnt("SF");    // 2
    const third = bcnt("3rd");   // 1
    const total = g + BRACKET.length; // 72 + 32 = 104

    // milestone = match count at which that stage STARTS
    const raw: Array<{ label: string; at: number; above: boolean }> = [
      { label: "Faza pucharowa", at: g,                    above: false },
      { label: "Ćwierćfinały",   at: g + r32 + r16,        above: true  },
      { label: "Półfinały",      at: g + r32 + r16 + qf,   above: false },
      { label: "Finał",          at: g + r32 + r16 + qf + sf + third, above: true },
    ];

    const milestones: Milestone[] = raw
      .filter((m) => m.at > 0 && m.at < total)
      .map((m) => ({
        ...m,
        pct: (m.at / total) * 100,
        reached: finished >= m.at,
      }));

    return { progressPct: (finished / total) * 100, milestones, finished, total };
  }, [matches]);

  const aboveMilestones = milestones.filter((m) => m.above);
  const belowMilestones = milestones.filter((m) => !m.above);

  return (
    <div className="px-4 pb-3 max-w-5xl mx-auto select-none">
      {/* Labels above the bar */}
      <div className="relative h-4">
        {aboveMilestones.map((m) => (
          <span
            key={m.label}
            className={`absolute bottom-1 -translate-x-1/2 text-[9px] whitespace-nowrap hidden sm:block transition-colors ${
              m.reached ? "text-zinc-400" : "text-zinc-600"
            }`}
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Bar + dots */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1 h-1.5 bg-zinc-800 rounded-full overflow-visible">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />

          {/* Milestone dots */}
          {milestones.map((m) => (
            <div
              key={m.label}
              title={m.label}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
              style={{ left: `${m.pct}%` }}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                  m.reached
                    ? "bg-green-500 border-green-300"
                    : "bg-zinc-950 border-zinc-500"
                }`}
              />
            </div>
          ))}
        </div>

        <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">
          {finished}/{total}
        </span>
      </div>

      {/* Labels below the bar */}
      <div className="relative h-4">
        {belowMilestones.map((m) => (
          <span
            key={m.label}
            className={`absolute top-1 -translate-x-1/2 text-[9px] whitespace-nowrap hidden sm:block transition-colors ${
              m.reached ? "text-zinc-400" : "text-zinc-600"
            }`}
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
