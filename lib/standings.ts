import type { MatchDoc, TeamDoc } from "@/lib/firebase/matches";

export interface TeamStanding {
  teamId: string;
  name: string;
  shortCode: string;
  flagUrl: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export function calculateGroupStandings(
  groupId: string,
  teams: TeamDoc[],
  matches: MatchDoc[]
): TeamStanding[] {
  const groupTeams = teams.filter((t) => t.groupId === groupId);

  const map = new Map<string, TeamStanding>(
    groupTeams.map((t) => [
      t.id,
      { teamId: t.id, name: t.name, shortCode: t.shortCode, flagUrl: t.flagUrl,
        mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 },
    ])
  );

  for (const m of matches) {
    if (m.groupId !== groupId || m.status !== "finished") continue;
    if (m.scoreA === undefined || m.scoreB === undefined) continue;

    const a = map.get(m.teamAId);
    const b = map.get(m.teamBId);
    if (!a || !b) continue;

    a.mp++; b.mp++;
    a.gf += m.scoreA; a.ga += m.scoreB;
    b.gf += m.scoreB; b.ga += m.scoreA;
    a.gd = a.gf - a.ga;
    b.gd = b.gf - b.ga;

    if (m.scoreA > m.scoreB) { a.w++; a.pts += 3; b.l++; }
    else if (m.scoreA < m.scoreB) { b.w++; b.pts += 3; a.l++; }
    else { a.d++; a.pts += 1; b.d++; b.pts += 1; }
  }

  return [...map.values()].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });
}
