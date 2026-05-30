import { Timestamp } from "firebase/firestore";

export interface User {
  name: string;
  pinHash: string;
  photoUrl: string;
  isAdmin: boolean;
  createdAt: Timestamp;
}

export interface Team {
  name: string;
  shortCode: string;
  flagUrl: string;
  groupId: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";
  eliminated: boolean;
}

export interface Match {
  stage: "group" | "R32" | "R16" | "QF" | "SF" | "3rd" | "final";
  groupId?: string;
  teamAId: string;
  teamBId: string;
  kickoff: Timestamp;
  status: "scheduled" | "finished";
  scoreA?: number;
  scoreB?: number;
  wentToPenalties?: boolean;
  penaltyWinnerId?: string;
}

export interface Bet {
  userId: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
  submittedAt: Timestamp;
  points?: number;
}

export interface OtherBet {
  userName: string;
  scoreA: number;
  scoreB: number;
  points?: number;
}

export interface Prediction {
  userId: string;
  groupWinners: Record<string, string>;
  groupRunnersUp: Record<string, string>;
  finalists: [string, string];
  champion: string;
  submittedAt: Timestamp;
  lockedAt: Timestamp;
  pointsBreakdown?: {
    groupWinners: number;
    groupRunnersUp: number;
    finalists: number;
    champion: number;
    total: number;
  };
}
