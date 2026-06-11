import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAllMatches, getAllTeams } from "@/lib/firebase/matches";
import { getFinishedMatches } from "@/lib/football-data";
import { calculatePoints } from "@/lib/firebase/scoring";
import { getAllUserStats, DEFAULT_USER_STATS } from "@/lib/firebase/user-stats";
import { CACHE_TAGS } from "@/lib/firebase/cached";
import type { MatchDoc } from "@/lib/firebase/matches";
import type { UserStats } from "@/lib/firebase/user-stats";

export const dynamic = "force-dynamic";

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
  const MATCH_DURATION_MS = 115 * 60 * 1000;

  // Manual override (emergency fallback): ?teamA=MEX&teamB=RSA&scoreA=2&scoreB=1
  const overrideTeamA = req.nextUrl.searchParams.get("teamA");
  const overrideTeamB = req.nextUrl.searchParams.get("teamB");
  const overrideScoreA = req.nextUrl.searchParams.get("scoreA");
  const overrideScoreB = req.nextUrl.searchParams.get("scoreB");
  const hasOverride = overrideTeamA && overrideTeamB && overrideScoreA !== null && overrideScoreB !== null;

  const [allMatches, allUserStatsMap] = await Promise.all([
    getAllMatches(),
    getAllUserStats(),
  ]);

  const pending = allMatches.filter(
    (m) => m.status === "scheduled" && new Date(m.kickoff).getTime() + MATCH_DURATION_MS < now
  );

  if (pending.length === 0) {
    return Response.json({ synced: 0, message: "No pending matches" });
  }

  const kickoffTimes = pending.map((m) => new Date(m.kickoff).getTime());
  const dateFrom = new Date(Math.min(...kickoffTimes)).toISOString().slice(0, 10);
  const dateTo = new Date(Math.max(...kickoffTimes) + 86_400_000).toISOString().slice(0, 10);

  const fdoMatches = await getFinishedMatches(dateFrom, dateTo);
  const teams = await getAllTeams();

  const db = getAdminDb();
  let synced = 0;
  const errors: string[] = [];

  // Live stats — copy Firestore values, updated as matches are scored (in kickoff order)
  const liveStats: Record<string, UserStats> = {};
  for (const [uid, s] of Object.entries(allUserStatsMap)) {
    liveStats[uid] = { ...DEFAULT_USER_STATS, ...s };
  }

  const groupsToCheck = new Set<string>();
  const justScoredMatchIds = new Set<string>();

  // ── Phase 1: score matches + bets ────────────────────────────────────────
  for (const match of pending) {
    const teamA = teams.find((t) => t.id === match.teamAId);
    const teamB = teams.find((t) => t.id === match.teamBId);
    if (!teamA || !teamB) {
      errors.push(`Unknown teams for match ${match.id}`);
      continue;
    }

    let scoreA: number;
    let scoreB: number;
    let wentToPenalties = false;
    let penaltyWinnerId: string | undefined;

    const isOverrideMatch =
      hasOverride &&
      ((overrideTeamA === teamA.shortCode && overrideTeamB === teamB.shortCode) ||
       (overrideTeamA === teamB.shortCode && overrideTeamB === teamA.shortCode));

    if (isOverrideMatch) {
      const rawA = parseInt(overrideScoreA!);
      const rawB = parseInt(overrideScoreB!);
      scoreA = overrideTeamA === teamA.shortCode ? rawA : rawB;
      scoreB = overrideTeamA === teamA.shortCode ? rawB : rawA;
    } else {
      const fdo = fdoMatches.find(
        (m) =>
          (m.homeTeam.tla === teamA.shortCode && m.awayTeam.tla === teamB.shortCode) ||
          (m.homeTeam.tla === teamB.shortCode && m.awayTeam.tla === teamA.shortCode)
      );
      if (!fdo) {
        errors.push(`No match found for ${teamA.shortCode}-${teamB.shortCode}`);
        continue;
      }
      if (fdo.score.fullTime.home === null) {
        errors.push(`Score not ready for ${teamA.shortCode}-${teamB.shortCode}`);
        continue;
      }

      const homeIsA = fdo.homeTeam.tla === teamA.shortCode;
      wentToPenalties = fdo.score.duration === "PENALTY_SHOOTOUT";

      const scoreHome = fdo.score.extraTime?.home ?? fdo.score.fullTime.home;
      const scoreAway = fdo.score.extraTime?.away ?? fdo.score.fullTime.away ?? 0;

      scoreA = homeIsA ? scoreHome : scoreAway;
      scoreB = homeIsA ? scoreAway : scoreHome;

      if (wentToPenalties && fdo.score.winner) {
        penaltyWinnerId =
          fdo.score.winner === "HOME_TEAM"
            ? (homeIsA ? match.teamAId : match.teamBId)
            : (homeIsA ? match.teamBId : match.teamAId);
      }
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
    justScoredMatchIds.add(match.id);
    if (match.groupId) groupsToCheck.add(match.groupId);

    const betSnap = await db.collection("bets").where("matchId", "==", match.id).get();
    if (!betSnap.empty) {
      const knockout =
        updatedMatch.stage !== "group"
          ? {
              penaltyWinnerId: updatedMatch.penaltyWinnerId,
              teamAId: updatedMatch.teamAId,
              teamBId: updatedMatch.teamBId,
            }
          : undefined;

      const betBatch = db.batch();

      for (const doc of betSnap.docs) {
        const d = doc.data();
        const userId = d.userId as string;

        const basePoints = calculatePoints(
          d.scoreA as number,
          d.scoreB as number,
          scoreA,
          scoreB,
          knockout
        );

        const stats = liveStats[userId] ?? { ...DEFAULT_USER_STATS };
        const isCorrect = basePoints > 0;
        const newStreak = isCorrect ? stats.currentStreak + 1 : 0;
        // Streak bonus kicks in from the 4th correct bet in a row
        const streakBonus = isCorrect && stats.currentStreak >= 3 ? 1 : 0;
        const isBoosterMatch = stats.boosterMatchId === match.id;
        const boosterMultiplier = isBoosterMatch ? 2 : 1;

        const finalPoints = basePoints * boosterMultiplier + streakBonus;

        betBatch.update(doc.ref, { points: finalPoints });

        liveStats[userId] = {
          ...stats,
          currentStreak: newStreak,
          exactScoreCount: stats.exactScoreCount + (basePoints >= 3 ? 1 : 0),
        };
      }

      await betBatch.commit();
    }

    synced++;
  }

  // Persist streak + exactScoreCount changes
  const statsBatch = db.batch();
  let hasStatChanges = false;
  for (const [userId, stats] of Object.entries(liveStats)) {
    const original = allUserStatsMap[userId];
    if (
      !original ||
      original.currentStreak !== stats.currentStreak ||
      original.exactScoreCount !== stats.exactScoreCount
    ) {
      statsBatch.set(
        db.collection("user_stats").doc(userId),
        { currentStreak: stats.currentStreak, exactScoreCount: stats.exactScoreCount },
        { merge: true }
      );
      hasStatChanges = true;
    }
  }
  if (hasStatChanges) await statsBatch.commit();

  // ── Phase 2: group bonus check ────────────────────────────────────────────
  for (const groupId of groupsToCheck) {
    const groupMatches = allMatches.filter((m) => m.groupId === groupId);
    const allGroupFinished = groupMatches.every(
      (m) => m.status === "finished" || justScoredMatchIds.has(m.id)
    );
    if (!allGroupFinished) continue;

    const groupMatchIds = groupMatches.map((m) => m.id);

    const betsByUser: Record<string, Record<string, number>> = {};
    for (const matchId of groupMatchIds) {
      const snap = await db.collection("bets").where("matchId", "==", matchId).get();
      for (const doc of snap.docs) {
        const d = doc.data();
        const userId = d.userId as string;
        if (!betsByUser[userId]) betsByUser[userId] = {};
        betsByUser[userId][matchId] = (d.points as number | undefined) ?? 0;
      }
    }

    const bonusBatch = db.batch();
    let hasBonuses = false;

    for (const [userId, matchPoints] of Object.entries(betsByUser)) {
      const stats = liveStats[userId] ?? { ...DEFAULT_USER_STATS };
      if (stats.completedGroups.includes(groupId)) continue;

      if (Object.keys(matchPoints).length < groupMatchIds.length) continue;
      if (!Object.values(matchPoints).every((pts) => pts >= 1)) continue;

      const newGroupBonusPoints = stats.groupBonusPoints + 5;
      const newCompletedGroups = [...stats.completedGroups, groupId];

      liveStats[userId] = {
        ...stats,
        completedGroups: newCompletedGroups,
        groupBonusPoints: newGroupBonusPoints,
      };

      bonusBatch.set(
        db.collection("user_stats").doc(userId),
        { completedGroups: newCompletedGroups, groupBonusPoints: newGroupBonusPoints },
        { merge: true }
      );
      hasBonuses = true;
    }

    if (hasBonuses) await bonusBatch.commit();
  }

  if (synced > 0) {
    revalidateTag(CACHE_TAGS.matches, { expire: 0 });
    revalidateTag(CACHE_TAGS.bets, { expire: 0 });
    revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  }

  return Response.json({ synced, pending: pending.length, errors });
}
