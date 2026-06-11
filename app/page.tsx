import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getAllUsers } from "@/lib/firebase/users";
import { getAllMatches, getAllTeams } from "@/lib/firebase/matches";
import { getBetsByUser, getAllBets } from "@/lib/firebase/bets";
import { getSpecialBetsByUser, getAllSpecialBets } from "@/lib/firebase/special-bets";
import { getAllUserStats } from "@/lib/firebase/user-stats";
import { CHAMPION_BET_DEADLINE, FIRST_KICKOFF_AT } from "@/lib/constants";
import HomeClient from "./home-client";
import type { OtherBet } from "@/lib/types";
import type { ScoreboardEntry } from "@/components/scoreboard";
import type { OtherSpecialBet } from "@/components/special-bets-panel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, matches, teams, myBets, allUsers, allBets, mySpecialBets, allSpecialBets, allUserStats] =
    await Promise.all([
      getUserById(session.userId),
      getAllMatches(),
      getAllTeams(),
      getBetsByUser(session.userId),
      getAllUsers(),
      getAllBets(),
      getSpecialBetsByUser(session.userId),
      getAllSpecialBets(),
      getAllUserStats(),
    ]);

  if (!user) redirect("/login");

  const teamsMap = Object.fromEntries(teams.map((t) => [t.id, t]));
  const userNameMap = Object.fromEntries(allUsers.map((u) => [u.id, u.name]));

  const otherBetsMap: Record<string, OtherBet[]> = {};
  const pointsPerUser: Record<string, number> = {};
  const betsCountPerUser: Record<string, number> = {};

  for (const bet of allBets) {
    pointsPerUser[bet.userId] = (pointsPerUser[bet.userId] ?? 0) + (bet.points ?? 0);
    betsCountPerUser[bet.userId] = (betsCountPerUser[bet.userId] ?? 0) + 1;

    if (bet.userId === session.userId) continue;
    const userName = userNameMap[bet.userId];
    if (!userName) continue;
    if (!otherBetsMap[bet.matchId]) otherBetsMap[bet.matchId] = [];
    otherBetsMap[bet.matchId].push({
      userName,
      scoreA: bet.scoreA,
      scoreB: bet.scoreB,
      points: bet.points,
    });
  }

  const scoreboard: ScoreboardEntry[] = allUsers.map((u) => {
    const stats = allUserStats[u.id];
    return {
      userId: u.id,
      userName: u.name,
      totalPoints: (pointsPerUser[u.id] ?? 0) + (stats?.groupBonusPoints ?? 0),
      betsCount: betsCountPerUser[u.id] ?? 0,
      streak: stats?.currentStreak ?? 0,
      completedGroups: stats?.completedGroups ?? [],
      exactScoreCount: stats?.exactScoreCount ?? 0,
    };
  });

  const isSpecialLocked = new Date() > CHAMPION_BET_DEADLINE;

  const otherChampionBets: OtherSpecialBet[] = isSpecialLocked
    ? allSpecialBets
        .filter((b) => b.type === "champion" && b.userId !== session.userId)
        .map((b) => ({
          userName: userNameMap[b.userId] ?? b.userId,
          teamId: b.teamId,
          teamName: b.teamName,
          flagUrl: b.flagUrl,
          points: b.points,
        }))
    : [];

  const myBoosterMatchId = allUserStats[session.userId]?.boosterMatchId ?? null;

  return (
    <HomeClient
      userName={user.name}
      currentUserId={session.userId}
      matches={matches}
      teams={teams}
      teamsMap={teamsMap}
      bets={myBets}
      otherBetsMap={otherBetsMap}
      scoreboard={scoreboard}
      myChampionBet={mySpecialBets["champion"]}
      otherChampionBets={otherChampionBets}
      isSpecialLocked={isSpecialLocked}
      myBoosterMatchId={myBoosterMatchId}
    />
  );
}
