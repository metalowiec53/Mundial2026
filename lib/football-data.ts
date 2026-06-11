const BASE_URL = "https://v3.football.api-sports.io";
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

interface ApiFbFixture {
  teams: {
    home: { code: string; winner: boolean | null };
    away: { code: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

// Kept as FdoMatch so route.ts needs no changes
export interface FdoMatch {
  homeTeam: { tla: string };
  awayTeam: { tla: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    fullTime: { home: number | null; away: number | null };
    extraTime: { home: number | null; away: number | null } | null;
    penalties: { home: number | null; away: number | null } | null;
  };
}

export async function getFinishedMatches(dateFrom: string, dateTo: string): Promise<FdoMatch[]> {
  const url = `${BASE_URL}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&status=FT&from=${dateFrom}&to=${dateTo}`;
  const res = await fetch(url, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`api-football ${res.status}: ${await res.text()}`);
  const data = await res.json() as { response: ApiFbFixture[] };

  return data.response.map((m): FdoMatch => {
    const hasPenalties = m.score.penalty.home !== null;
    const winner = m.teams.home.winner === true ? "HOME_TEAM"
                 : m.teams.away.winner === true ? "AWAY_TEAM"
                 : "DRAW";

    return {
      homeTeam: { tla: m.teams.home.code },
      awayTeam: { tla: m.teams.away.code },
      score: {
        winner,
        duration: hasPenalties ? "PENALTY_SHOOTOUT" : "REGULAR",
        // goals.home/away = final score including ET goals, excluding penalties
        fullTime: { home: m.goals.home, away: m.goals.away },
        extraTime: null,
        penalties: hasPenalties
          ? { home: m.score.penalty.home, away: m.score.penalty.away }
          : null,
      },
    };
  });
}
