import { getAdminDb } from "./admin";

export interface UserStats {
  boosterMatchId: string | null;
  currentStreak: number;
  completedGroups: string[];
  groupBonusPoints: number;
  exactScoreCount: number;
}

export const DEFAULT_USER_STATS: UserStats = {
  boosterMatchId: null,
  currentStreak: 0,
  completedGroups: [],
  groupBonusPoints: 0,
  exactScoreCount: 0,
};

function fromDoc(data: FirebaseFirestore.DocumentData): UserStats {
  return {
    boosterMatchId: (data.boosterMatchId as string | null) ?? null,
    currentStreak: (data.currentStreak as number) ?? 0,
    completedGroups: (data.completedGroups as string[]) ?? [],
    groupBonusPoints: (data.groupBonusPoints as number) ?? 0,
    exactScoreCount: (data.exactScoreCount as number) ?? 0,
  };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const doc = await getAdminDb().collection("user_stats").doc(userId).get();
  if (!doc.exists) return { ...DEFAULT_USER_STATS };
  return fromDoc(doc.data()!);
}

export async function getAllUserStats(): Promise<Record<string, UserStats>> {
  const snap = await getAdminDb().collection("user_stats").get();
  const result: Record<string, UserStats> = {};
  for (const doc of snap.docs) {
    result[doc.id] = fromDoc(doc.data());
  }
  return result;
}

export async function setBoosterMatch(userId: string, matchId: string | null): Promise<void> {
  await getAdminDb()
    .collection("user_stats")
    .doc(userId)
    .set({ boosterMatchId: matchId }, { merge: true });
}
