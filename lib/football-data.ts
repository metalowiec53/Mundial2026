const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC";

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
  // No status filter — we check for non-null scores client-side.
  // football-data.org sometimes marks WC matches FINISHED before populating scores.
  const url = `${BASE_URL}/competitions/${COMPETITION}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  const data = await res.json() as { matches: FdoMatch[] };
  return data.matches.filter((m) => m.score.fullTime.home !== null);
}
