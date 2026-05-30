import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getAllUsers } from "@/lib/firebase/users";
import { getAllMatches, getAllTeams } from "@/lib/firebase/matches";
import { getBetsByUser, getAllBets } from "@/lib/firebase/bets";
import { getSpecialBetsByUser, getAllSpecialBets } from "@/lib/firebase/special-bets";
import { FIRST_KICKOFF_AT } from "@/lib/constants";
import HomeClient from "./home-client";
import type { OtherBet } from "@/lib/types";
import type { ScoreboardEntry } from "@/components/scoreboard";
import type { OtherSpecialBet } from "@/components/special-bets-panel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, matches, teams, myBets, allUsers, allBets, mySpecialBets, allSpecialBets] =
    await Promise.all([
      getUserById(session.userId),
      getAllMatches(),
      getAllTeams(),
      getBetsByUser(session.userId),
      getAllUsers(),
      getAllBets(),
      getSpecialBetsByUser(session.userId),
      getAllSpecialBets(),
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

  const scoreboard: ScoreboardEntry[] = allUsers.map((u) => ({
    userId: u.id,
    userName: u.name,
    totalPoints: pointsPerUser[u.id] ?? 0,
    betsCount: betsCountPerUser[u.id] ?? 0,
  }));

  const isSpecialLocked = new Date() >= FIRST_KICKOFF_AT;

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
    />
  );
}
