import { getAdminDb } from "./admin";
import { Timestamp } from "firebase-admin/firestore";

export interface SpecialBetDoc {
  userId: string;
  type: "champion";
  teamId: string;
  teamName: string;
  flagUrl: string;
  points?: number;
}

export async function getSpecialBetsByUser(
  userId: string
): Promise<Record<string, SpecialBetDoc>> {
  const snapshot = await getAdminDb()
    .collection("special_bets")
    .where("userId", "==", userId)
    .get();

  const result: Record<string, SpecialBetDoc> = {};
  for (const doc of snapshot.docs) {
    const d = doc.data();
    const type = d.type as string;
    result[type] = {
      userId: d.userId as string,
      type: d.type as "champion",
      teamId: d.teamId as string,
      teamName: d.teamName as string,
      flagUrl: d.flagUrl as string,
      points: d.points as number | undefined,
    };
  }
  return result;
}

export async function getAllSpecialBets(): Promise<SpecialBetDoc[]> {
  const snapshot = await getAdminDb().collection("special_bets").get();
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      userId: d.userId as string,
      type: d.type as "champion",
      teamId: d.teamId as string,
      teamName: d.teamName as string,
      flagUrl: d.flagUrl as string,
      points: d.points as number | undefined,
    };
  });
}

export async function saveSpecialBet(
  userId: string,
  type: "champion",
  teamId: string,
  teamName: string,
  flagUrl: string
): Promise<void> {
  const docId = `${userId}_${type}`;
  await getAdminDb()
    .collection("special_bets")
    .doc(docId)
    .create({ userId, type, teamId, teamName, flagUrl, submittedAt: Timestamp.now() });
}
