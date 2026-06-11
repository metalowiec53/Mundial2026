"use server";

import { updateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { getMatchById } from "@/lib/firebase/matches";
import { getUserStats, setBoosterMatch } from "@/lib/firebase/user-stats";
import { CACHE_TAGS } from "@/lib/firebase/cached";

export async function setBoosterAction(
  matchId: string | null
): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) return { error: "Nie zalogowany" };

  if (matchId !== null) {
    const match = await getMatchById(matchId);
    if (!match) return { error: "Nieznany mecz" };
    if (match.stage === "group") return { error: "Doładowanie dostępne tylko w fazie pucharowej" };
    if (new Date(match.kickoff) <= new Date()) return { error: "Mecz już się rozpoczął" };

    const stats = await getUserStats(session.userId);
    if (stats.boosterMatchId && stats.boosterMatchId !== matchId) {
      const existingMatch = await getMatchById(stats.boosterMatchId);
      if (existingMatch && new Date(existingMatch.kickoff) <= new Date()) {
        return { error: "Doładowanie zostało już wykorzystane" };
      }
    }
  }

  await setBoosterMatch(session.userId, matchId);
  updateTag(CACHE_TAGS.userStats);
}
