"use client";

import type { TeamStanding } from "@/lib/standings";

interface Props {
  standings: TeamStanding[];
}

export default function GroupStandings({ standings }: Props) {
  return (
    <div className="bg-zinc-800/60 rounded-2xl overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-700/60">
            <th className="text-left pl-3 pr-1 py-2 font-medium w-6">#</th>
            <th className="text-left px-1 py-2 font-medium">Drużyna</th>
            <th className="py-2 font-medium w-7">M</th>
            <th className="py-2 font-medium w-7">W</th>
            <th className="py-2 font-medium w-7">R</th>
            <th className="py-2 font-medium w-7">P</th>
            <th className="py-2 font-medium w-9">Br</th>
            <th className="py-2 font-medium w-8 pr-3 text-right">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const isAdvancing = i < 2;
            const dotColor = i === 0
              ? "bg-green-500"
              : i === 1
              ? "bg-green-600/70"
              : "bg-transparent";

            return (
              <tr
                key={s.teamId}
                className={`border-b border-zinc-700/40 last:border-0 ${
                  isAdvancing ? "text-white" : "text-zinc-400"
                }`}
              >
                <td className="pl-3 pr-1 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                    />
                    <span className="text-zinc-500">{i + 1}</span>
                  </div>
                </td>
                <td className="px-1 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={s.flagUrl}
                      alt={s.shortCode}
                      width={18}
                      height={13}
                      className="rounded-sm object-cover shrink-0"
                    />
                    <span className="font-medium truncate max-w-[70px]">{s.shortCode}</span>
                  </div>
                </td>
                <td className="py-2.5 text-center text-zinc-400">{s.mp}</td>
                <td className="py-2.5 text-center text-zinc-400">{s.w}</td>
                <td className="py-2.5 text-center text-zinc-400">{s.d}</td>
                <td className="py-2.5 text-center text-zinc-400">{s.l}</td>
                <td className="py-2.5 text-center text-zinc-400">
                  {s.gd > 0 ? `+${s.gd}` : s.gd}
                </td>
                <td className="py-2.5 pr-3 text-right font-bold">{s.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
