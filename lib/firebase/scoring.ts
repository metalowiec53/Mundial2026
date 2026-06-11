import { getAdminDb } from "./admin";
import type { MatchDoc } from "./matches";

type Outcome = "A" | "B" | "draw";

function outcome(a: number, b: number): Outcome {
  if (a > b) return "A";
  if (b > a) return "B";
  return "draw";
}

export function calculatePoints(
  betA: number,
  betB: number,
  actualA: number,
  actualB: number,
  knockout?: { penaltyWinnerId?: string; teamAId: string; teamBId: string }
): number {
  const exactScore = betA === actualA && betB === actualB;

  if (!knockout) {
    if (exactScore) return 3;
    if (outcome(betA, betB) === outcome(actualA, actualB)) return 1;
    return 0;
  }

  // Knockout: 3 pts for exact ET score + 1 pt for correct winner — stackable (max 4)
  const actualWinner =
    actualA > actualB ? knockout.teamAId
    : actualB > actualA ? knockout.teamBId
    : knockout.penaltyWinnerId;

  // Bets can't be draws in knockout, so bet always implies a winner
  const betWinner = betA > betB ? knockout.teamAId : knockout.teamBId;

  let points = 0;
  if (exactScore) points += 3;
  if (actualWinner && betWinner === actualWinner) points += 1;
  return points;
}

export async function scoreMatchBets(match: MatchDoc): Promise<void> {
  if (match.scoreA === undefined || match.scoreB === undefined) return;

  const db = getAdminDb();
  const snap = await db.collection("bets").where("matchId", "==", match.id).get();
  if (snap.empty) return;

  const knockout =
    match.stage !== "group"
      ? { penaltyWinnerId: match.penaltyWinnerId, teamAId: match.teamAId, teamBId: match.teamBId }
      : undefined;

  const batch = db.batch();
  for (const doc of snap.docs) {
    const d = doc.data();
    const points = calculatePoints(
      d.scoreA as number,
      d.scoreB as number,
      match.scoreA,
      match.scoreB,
      knockout
    );
    batch.update(doc.ref, { points });
  }
  await batch.commit();
}
