"use client";

import { useState, useMemo } from "react";
import type { MatchDoc, TeamDoc } from "@/lib/firebase/matches";
import type { BetDoc } from "@/lib/firebase/bets";
import type { SpecialBetDoc } from "@/lib/firebase/special-bets";
import type { OtherBet } from "@/lib/types";
import type { ScoreboardEntry } from "@/components/scoreboard";
import type { OtherSpecialBet } from "@/components/special-bets-panel";
import { calculateGroupStandings } from "@/lib/standings";
import MatchCard from "@/components/match-card";
import GroupStandings from "@/components/group-standings";
import Scoreboard from "@/components/scoreboard";
import SpecialBetsPanel from "@/components/special-bets-panel";
import NextMatchPanel from "@/components/next-match-panel";
import BracketView from "@/components/bracket-view";
import ScoringRules from "@/components/scoring-rules";
import TournamentProgress from "@/components/tournament-progress";
import { logoutAction } from "@/app/actions";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

interface Props {
  userName: string;
  currentUserId: string;
  matches: MatchDoc[];
  teams: TeamDoc[];
  teamsMap: Record<string, TeamDoc>;
  bets: Record<string, BetDoc>;
  otherBetsMap: Record<string, OtherBet[]>;
  scoreboard: ScoreboardEntry[];
  myChampionBet?: SpecialBetDoc;
  otherChampionBets: OtherSpecialBet[];
  isSpecialLocked: boolean;
  myBoosterMatchId: string | null;
}

export default function HomeClient({
  userName,
  currentUserId,
  matches,
  teams,
  teamsMap,
  bets,
  otherBetsMap,
  scoreboard,
  myChampionBet,
  otherChampionBets,
  isSpecialLocked,
  myBoosterMatchId,
}: Props) {
  const [mainTab, setMainTab] = useState<"grupy" | "drabinka">("grupy");
  const [activeGroup, setActiveGroup] = useState<string>("A");
  const [mobileTab, setMobileTab] = useState<"typy" | "ranking">("typy");

  const groupMatches = useMemo(
    () => matches.filter((m) => m.groupId === activeGroup),
    [matches, activeGroup]
  );
  const knockoutMatches = useMemo(
    () => matches.filter((m) => m.stage !== "group"),
    [matches]
  );
  const standings = useMemo(
    () => calculateGroupStandings(activeGroup, teams, matches),
    [activeGroup, teams, matches]
  );

  const now = useMemo(() => new Date(), []);
  const nextMatch = useMemo(() => {
    return matches
      .filter((m) => m.groupId && new Date(m.kickoff) > now)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0] ?? null;
  }, [matches, now]);

  const betsInGroup = groupMatches.filter((m) => bets[m.id]).length;
  const totalInGroup = groupMatches.length;

  const nextMatchPanel = (
    <NextMatchPanel
      match={nextMatch}
      teamA={nextMatch ? teamsMap[nextMatch.teamAId] : undefined}
      teamB={nextMatch ? teamsMap[nextMatch.teamBId] : undefined}
      bet={nextMatch ? bets[nextMatch.id] : undefined}
      onGroupSelect={(g) => {
        setActiveGroup(g);
        setMainTab("grupy");
        setMobileTab("typy");
      }}
    />
  );

  const groupContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Grupa {activeGroup}</h2>
        <span className="text-xs text-zinc-600">
          {betsInGroup}/{totalInGroup} obranych
        </span>
      </div>
      <GroupStandings standings={standings} />
      <div className="space-y-2.5">
        {groupMatches.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">Brak meczów w tej grupie.</p>
        ) : (
          groupMatches.map((match) => {
            const teamA = teamsMap[match.teamAId];
            const teamB = teamsMap[match.teamBId];
            if (!teamA || !teamB) return null;
            return (
              <MatchCard
                key={match.id}
                match={match}
                teamA={teamA}
                teamB={teamB}
                bet={bets[match.id]}
                otherBets={otherBetsMap[match.id]}
              />
            );
          })
        )}
      </div>
    </div>
  );

  const rankingContent = (
    <div className="space-y-4">
      <ScoringRules />
      <SpecialBetsPanel
        teams={teams}
        myBet={myChampionBet}
        otherBets={otherChampionBets}
        isLocked={isSpecialLocked}
      />
      <Scoreboard entries={scoreboard} currentUserId={currentUserId} />
    </div>
  );

  const bracketContent = (
    <BracketView
      knockoutMatches={knockoutMatches}
      teamsMap={teamsMap}
      bets={bets}
      otherBetsMap={otherBetsMap}
      myBoosterMatchId={myBoosterMatchId}
    />
  );

  const showGroupTabs = mainTab === "grupy" && mobileTab !== "ranking";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div>
            <h1 className="text-sm font-bold text-white">Mundial 2026</h1>
            <p className="text-xs text-zinc-500">Cześć, {userName}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
            >
              Wyloguj
            </button>
          </form>
        </div>

        {/* Main nav: Grupy / Drabinka */}
        <div className="flex gap-1.5 px-4 pb-2 max-w-5xl mx-auto">
          {(["grupy", "drabinka"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                mainTab === tab
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "grupy" ? "Grupy" : "Drabinka"}
            </button>
          ))}
        </div>

        {/* Group tabs — only in Grupy mode */}
        {showGroupTabs && (
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto max-w-5xl mx-auto">
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`flex-shrink-0 w-9 h-8 rounded-lg text-xs font-bold transition-all ${
                  activeGroup === g
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/40"
                    : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Typy / Ranking switcher — only in Grupy mode */}
        {mainTab === "grupy" && (
          <div className="flex lg:hidden px-4 pb-3 gap-2 max-w-5xl mx-auto">
            {(["typy", "ranking"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  mobileTab === tab
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "typy" ? "Typy" : "Ranking"}
              </button>
            ))}
          </div>
        )}

        <TournamentProgress matches={matches} />
      </header>

      {/* ── Drabinka ─────────────────────────────────────── */}
      {mainTab === "drabinka" && (
        <div className="max-w-3xl mx-auto px-4 py-4">
          {bracketContent}
        </div>
      )}

      {/* ── Grupy — mobile ───────────────────────────────── */}
      {mainTab === "grupy" && (
        <>
          <div className="lg:hidden px-4 py-4 space-y-4 max-w-5xl mx-auto">
            {mobileTab === "typy" ? (
              <>
                {nextMatchPanel}
                {groupContent}
              </>
            ) : (
              rankingContent
            )}
          </div>

          {/* ── Grupy — desktop 3-column ─────────────────── */}
          <div className="hidden lg:grid lg:grid-cols-[220px_1fr_256px] gap-4 max-w-5xl mx-auto px-4 py-4 items-start">
            <div className="sticky top-[132px]">{nextMatchPanel}</div>
            <div>{groupContent}</div>
            <div className="sticky top-[132px] space-y-4">{rankingContent}</div>
          </div>
        </>
      )}
    </div>
  );
}
