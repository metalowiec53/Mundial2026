"use server";

import { getSession } from "@/lib/auth";
import { getAllTeams } from "@/lib/firebase/matches";
import { saveSpecialBet } from "@/lib/firebase/special-bets";
import { FIRST_KICKOFF_AT } from "@/lib/constants";

export async function saveChampionBetAction(
  teamId: string
): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) return { error: "Nie zalogowany" };

  if (new Date() >= FIRST_KICKOFF_AT) {
    return { error: "Typy specjalne są zablokowane — turniej już się rozpoczął" };
  }

  const teams = await getAllTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return { error: "Nieznana drużyna" };

  try {
    await saveSpecialBet(session.userId, "champion", team.id, team.name, team.flagUrl);
  } catch {
    return { error: "Już oddałeś typ na zwycięzcę — nie można zmienić" };
  }
}
