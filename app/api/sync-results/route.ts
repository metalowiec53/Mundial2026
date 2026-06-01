import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAllMatches, getAllTeams } from "@/lib/firebase/matches";
import { getFinishedMatches } from "@/lib/football-data";
import { scoreMatchBets } from "@/lib/firebase/scoring";
import type { MatchDoc } from "@/lib/firebase/matches";

export const dynamic = "force-dynamic";

// Called by Vercel Cron (Authorization header) or manually (?secret=...)
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  const authorized =
    (expected && cronSecret === `Bearer ${expected}`) ||
    (expected && querySecret === expected);

  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const MATCH_DURATION_MS = 115 * 60 * 1000; // 115 min buffer for 90min + stoppage

  const allMatches = await getAllMatches();
  const pending = allMatches.filter(
    (m) => m.status === "scheduled" && new Date(m.kickoff).getTime() + MATCH_DURATION_MS < now
  );

  if (pending.length === 0) {
    return Response.json({ synced: 0, message: "No pending matches" });
  }

  const kickoffTimes = pending.map((m) => new Date(m.kickoff).getTime());
  const dateFrom = new Date(Math.min(...kickoffTimes)).toISOString().slice(0, 10);
  // +1 day to cover matches that started before midnight but ended after
  const dateTo = new Date(Math.max(...kickoffTimes) + 86_400_000).toISOString().slice(0, 10);

  const fdoMatches = await getFinishedMatches(dateFrom, dateTo);
  const teams = await getAllTeams();

  const db = getAdminDb();
  let synced = 0;
  const errors: string[] = [];

  for (const match of pending) {
    const teamA = teams.find((t) => t.id === match.teamAId);
    const teamB = teams.find((t) => t.id === match.teamBId);
    if (!teamA || !teamB) {
      errors.push(`Unknown teams for match ${match.id}`);
      continue;
    }

    const fdo = fdoMatches.find(
      (m) =>
        (m.homeTeam.tla === teamA.shortCode && m.awayTeam.tla === teamB.shortCode) ||
        (m.homeTeam.tla === teamB.shortCode && m.awayTeam.tla === teamA.shortCode)
    );

    if (!fdo) continue; // not finished yet according to football-data.org
    if (fdo.score.fullTime.home === null) continue;

    const homeIsA = fdo.homeTeam.tla === teamA.shortCode;
    const wentToPenalties = fdo.score.duration === "PENALTY_SHOOTOUT";

    // For knockout matches use extraTime score (actual goals), fallback to fullTime
    const scoreHome = fdo.score.extraTime?.home ?? fdo.score.fullTime.home;
    const scoreAway = fdo.score.extraTime?.away ?? fdo.score.fullTime.away ?? 0;

    const scoreA = homeIsA ? scoreHome : scoreAway;
    const scoreB = homeIsA ? scoreAway : scoreHome;

    let penaltyWinnerId: string | undefined;
    if (wentToPenalties && fdo.score.winner) {
      penaltyWinnerId =
        fdo.score.winner === "HOME_TEAM"
          ? (homeIsA ? match.teamAId : match.teamBId)
          : (homeIsA ? match.teamBId : match.teamAId);
    }

    const update: Partial<MatchDoc> & { status: "finished" } = {
      status: "finished",
      scoreA,
      scoreB,
      wentToPenalties,
      ...(penaltyWinnerId ? { penaltyWinnerId } : {}),
    };

    await db.collection("matches").doc(match.id).update(update);

    const updatedMatch: MatchDoc = { ...match, ...update };
    await scoreMatchBets(updatedMatch);
    synced++;
  }

  return Response.json({ synced, pending: pending.length, errors });
}
