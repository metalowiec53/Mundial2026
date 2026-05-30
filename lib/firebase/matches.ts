import { getAdminDb } from "./admin";

export interface MatchDoc {
  id: string;
  stage: "group" | "R32" | "R16" | "QF" | "SF" | "3rd" | "final";
  groupId?: string;
  teamAId: string;
  teamBId: string;
  kickoff: string; // ISO UTC
  status: "scheduled" | "finished";
  scoreA?: number;
  scoreB?: number;
  wentToPenalties?: boolean;
  penaltyWinnerId?: string;
}

export interface TeamDoc {
  id: string;
  name: string;
  shortCode: string;
  flagUrl: string;
  groupId: string;
  eliminated: boolean;
}

function toMatchDoc(id: string, data: FirebaseFirestore.DocumentData): MatchDoc {
  return {
    id,
    stage: data.stage as MatchDoc["stage"],
    groupId: data.groupId as string | undefined,
    teamAId: data.teamAId as string,
    teamBId: data.teamBId as string,
    kickoff: (data.kickoff as { toDate(): Date }).toDate().toISOString(),
    status: data.status as MatchDoc["status"],
    scoreA: data.scoreA as number | undefined,
    scoreB: data.scoreB as number | undefined,
    wentToPenalties: data.wentToPenalties as boolean | undefined,
    penaltyWinnerId: data.penaltyWinnerId as string | undefined,
  };
}

export async function getAllMatches(): Promise<MatchDoc[]> {
  const snapshot = await getAdminDb()
    .collection("matches")
    .orderBy("kickoff")
    .get();
  return snapshot.docs.map((doc) => toMatchDoc(doc.id, doc.data()));
}

export async function getMatchById(matchId: string): Promise<MatchDoc | null> {
  const doc = await getAdminDb().collection("matches").doc(matchId).get();
  if (!doc.exists) return null;
  return toMatchDoc(doc.id, doc.data()!);
}

export async function getAllTeams(): Promise<TeamDoc[]> {
  const snapshot = await getAdminDb().collection("teams").get();
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name as string,
      shortCode: d.shortCode as string,
      flagUrl: d.flagUrl as string,
      groupId: d.groupId as string,
      eliminated: d.eliminated as boolean,
    };
  });
}
