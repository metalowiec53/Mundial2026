"use server";

import { updateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { getMatchById } from "@/lib/firebase/matches";
import { upsertBet } from "@/lib/firebase/bets";
import { CACHE_TAGS } from "@/lib/firebase/cached";

export async function saveBetAction(
  matchId: string,
  scoreA: number,
  scoreB: number
): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) return { error: "Nie zalogowany" };

  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
    return { error: "Nieprawidłowy wynik" };
  }

  const match = await getMatchById(matchId);
  if (!match) return { error: "Nie znaleziono meczu" };

  if (new Date(match.kickoff) <= new Date()) {
    return { error: "Zakład zablokowany — mecz już się rozpoczął" };
  }

  if (match.stage !== "group" && scoreA === scoreB) {
    return { error: "W fazie pucharowej nie można typować remisu" };
  }

  await upsertBet(session.userId, matchId, scoreA, scoreB);
  updateTag(CACHE_TAGS.bets);
}
