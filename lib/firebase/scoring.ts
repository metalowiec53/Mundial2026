import { getAdminDb } from "./admin";
import type { MatchDoc } from "./matches";

type Outcome = "A" | "B" | "draw";

function outcome(a: number, b: number): Outcome {
  if (a > b) return "A";
  if (b > a) return "B";
  return "draw";
}

export function calculatePoints(betA: number, betB: number, actualA: number, actualB: number): number {
  if (betA === actualA && betB === actualB) return 3;
  if (outcome(betA, betB) === outcome(actualA, actualB)) return 1;
  return 0;
}

export async function scoreMatchBets(match: MatchDoc): Promise<void> {
  if (match.scoreA === undefined || match.scoreB === undefined) return;

  const db = getAdminDb();
  const snap = await db.collection("bets").where("matchId", "==", match.id).get();
  if (snap.empty) return;

  const batch = db.batch();
  for (const doc of snap.docs) {
    const d = doc.data();
    const points = calculatePoints(d.scoreA as number, d.scoreB as number, match.scoreA, match.scoreB);
    batch.update(doc.ref, { points });
  }
  await batch.commit();
}
