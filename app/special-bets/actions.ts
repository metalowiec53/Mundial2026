"use server";

import { getSession } from "@/lib/auth";
import { getAllTeams } from "@/lib/firebase/matches";
import { saveSpecialBet } from "@/lib/firebase/special-bets";
import { CHAMPION_BET_DEADLINE } from "@/lib/constants";

export async function saveChampionBetAction(
  teamId: string
): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) return { error: "Nie zalogowany" };

  if (new Date() > CHAMPION_BET_DEADLINE) {
    return { error: "Typ na zwycięzcę jest zablokowany — minął termin 14 czerwca" };
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
