import { unstable_cache } from "next/cache";
import { getAllMatches, getAllTeams } from "./matches";
import { getAllUsers, getUserById } from "./users";
import { getAllBets } from "./bets";
import { getAllSpecialBets } from "./special-bets";
import { getAllUserStats } from "./user-stats";

export const CACHE_TAGS = {
  matches:     "matches",
  teams:       "teams",
  users:       "users",
  bets:        "bets",
  specialBets: "special-bets",
  userStats:   "user-stats",
} as const;

// Teams never change during the tournament
export const getCachedAllTeams = unstable_cache(
  getAllTeams,
  ["all-teams"],
  { tags: [CACHE_TAGS.teams], revalidate: 3600 }
);

// Matches change only when sync-results runs → revalidated there
export const getCachedAllMatches = unstable_cache(
  getAllMatches,
  ["all-matches"],
  { tags: [CACHE_TAGS.matches], revalidate: 60 }
);

export const getCachedAllUsers = unstable_cache(
  getAllUsers,
  ["all-users"],
  { tags: [CACHE_TAGS.users], revalidate: 300 }
);

// All bets — used for scoreboard + other players' scores
// Change only on sync-results or when a user places a bet (60s tolerance is fine for others)
export const getCachedAllBets = unstable_cache(
  getAllBets,
  ["all-bets"],
  { tags: [CACHE_TAGS.bets], revalidate: 60 }
);

export const getCachedAllSpecialBets = unstable_cache(
  getAllSpecialBets,
  ["all-special-bets"],
  { tags: [CACHE_TAGS.specialBets], revalidate: 300 }
);

// User stats — change on sync-results or on booster toggle
export const getCachedAllUserStats = unstable_cache(
  getAllUserStats,
  ["all-user-stats"],
  { tags: [CACHE_TAGS.userStats], revalidate: 60 }
);

// User info — rarely changes
export const getCachedUserById = unstable_cache(
  getUserById,
  ["user-by-id"],
  { tags: [CACHE_TAGS.users], revalidate: 300 }
);

// NOTE: getBetsByUser and getSpecialBetsByUser are intentionally NOT cached.
// They must always be fresh so the player sees their own bets/champion pick immediately.
