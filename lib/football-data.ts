const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC";

export interface FdoMatch {
  id: number;
  utcDate: string;
  status: string;
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
  const url = `${BASE_URL}/competitions/${COMPETITION}/matches?status=FINISHED&dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  const data = await res.json() as { matches: FdoMatch[] };
  return data.matches;
}
