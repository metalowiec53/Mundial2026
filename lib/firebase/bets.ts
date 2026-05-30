import { getAdminDb } from "./admin";
import { Timestamp } from "firebase-admin/firestore";

export interface BetDoc {
  matchId: string;
  scoreA: number;
  scoreB: number;
  points?: number;
}

export interface AllBetDoc {
  userId: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
  points?: number;
}

export async function getBetsByUser(userId: string): Promise<Record<string, BetDoc>> {
  const snapshot = await getAdminDb()
    .collection("bets")
    .where("userId", "==", userId)
    .get();

  const result: Record<string, BetDoc> = {};
  for (const doc of snapshot.docs) {
    const d = doc.data();
    const matchId = d.matchId as string;
    result[matchId] = {
      matchId,
      scoreA: d.scoreA as number,
      scoreB: d.scoreB as number,
      points: d.points as number | undefined,
    };
  }
  return result;
}

export async function getAllBets(): Promise<AllBetDoc[]> {
  const snapshot = await getAdminDb().collection("bets").get();
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      userId: d.userId as string,
      matchId: d.matchId as string,
      scoreA: d.scoreA as number,
      scoreB: d.scoreB as number,
      points: d.points as number | undefined,
    };
  });
}

export async function upsertBet(
  userId: string,
  matchId: string,
  scoreA: number,
  scoreB: number
): Promise<void> {
  const betId = `${userId}_${matchId}`;
  await getAdminDb()
    .collection("bets")
    .doc(betId)
    .set({ userId, matchId, scoreA, scoreB, submittedAt: Timestamp.now() });
}
