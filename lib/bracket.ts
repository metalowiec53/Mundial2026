export interface BracketSlot {
  label: string;
}

export interface BracketMatchDef {
  id: string;
  stage: "R32" | "R16" | "QF" | "SF" | "3rd" | "final";
  slotA: BracketSlot;
  slotB: BracketSlot;
}

// R32 matchups per official FIFA 2026 bracket.
// 3rd-place slots show the set of groups from which the best 3rd-place qualifier will come.
// Matches in Firestore should use these IDs (M73–M104).
export const BRACKET: BracketMatchDef[] = [
  // ── Round of 32 ──────────────────────────────────────────
  { id: "M73",  stage: "R32",   slotA: { label: "2. Gr. A" },           slotB: { label: "2. Gr. B" } },
  { id: "M74",  stage: "R32",   slotA: { label: "1. Gr. E" },           slotB: { label: "3. Gr. A/B/C/D/F" } },
  { id: "M75",  stage: "R32",   slotA: { label: "1. Gr. F" },           slotB: { label: "2. Gr. C" } },
  { id: "M76",  stage: "R32",   slotA: { label: "1. Gr. C" },           slotB: { label: "2. Gr. F" } },
  { id: "M77",  stage: "R32",   slotA: { label: "1. Gr. I" },           slotB: { label: "3. Gr. C/D/F/G/H" } },
  { id: "M78",  stage: "R32",   slotA: { label: "2. Gr. E" },           slotB: { label: "2. Gr. I" } },
  { id: "M79",  stage: "R32",   slotA: { label: "1. Gr. A" },           slotB: { label: "3. Gr. C/E/F/H/I" } },
  { id: "M80",  stage: "R32",   slotA: { label: "1. Gr. L" },           slotB: { label: "3. Gr. E/H/I/J/K" } },
  { id: "M81",  stage: "R32",   slotA: { label: "1. Gr. D" },           slotB: { label: "3. Gr. B/E/F/I/J" } },
  { id: "M82",  stage: "R32",   slotA: { label: "1. Gr. G" },           slotB: { label: "3. Gr. A/E/H/I/J" } },
  { id: "M83",  stage: "R32",   slotA: { label: "2. Gr. K" },           slotB: { label: "2. Gr. L" } },
  { id: "M84",  stage: "R32",   slotA: { label: "1. Gr. H" },           slotB: { label: "2. Gr. J" } },
  { id: "M85",  stage: "R32",   slotA: { label: "1. Gr. B" },           slotB: { label: "3. Gr. E/F/G/I/J" } },
  { id: "M86",  stage: "R32",   slotA: { label: "1. Gr. J" },           slotB: { label: "2. Gr. H" } },
  { id: "M87",  stage: "R32",   slotA: { label: "1. Gr. K" },           slotB: { label: "3. Gr. D/E/I/J/L" } },
  { id: "M88",  stage: "R32",   slotA: { label: "2. Gr. D" },           slotB: { label: "2. Gr. G" } },

  // ── Round of 16 ──────────────────────────────────────────
  { id: "M89",  stage: "R16",   slotA: { label: "Zw. M73" },            slotB: { label: "Zw. M75" } },
  { id: "M90",  stage: "R16",   slotA: { label: "Zw. M74" },            slotB: { label: "Zw. M76" } },
  { id: "M91",  stage: "R16",   slotA: { label: "Zw. M77" },            slotB: { label: "Zw. M78" } },
  { id: "M92",  stage: "R16",   slotA: { label: "Zw. M79" },            slotB: { label: "Zw. M80" } },
  { id: "M93",  stage: "R16",   slotA: { label: "Zw. M83" },            slotB: { label: "Zw. M84" } },
  { id: "M94",  stage: "R16",   slotA: { label: "Zw. M81" },            slotB: { label: "Zw. M82" } },
  { id: "M95",  stage: "R16",   slotA: { label: "Zw. M86" },            slotB: { label: "Zw. M88" } },
  { id: "M96",  stage: "R16",   slotA: { label: "Zw. M85" },            slotB: { label: "Zw. M87" } },

  // ── Quarter-finals ────────────────────────────────────────
  { id: "M97",  stage: "QF",    slotA: { label: "Zw. M89" },            slotB: { label: "Zw. M90" } },
  { id: "M98",  stage: "QF",    slotA: { label: "Zw. M93" },            slotB: { label: "Zw. M94" } },
  { id: "M99",  stage: "QF",    slotA: { label: "Zw. M91" },            slotB: { label: "Zw. M92" } },
  { id: "M100", stage: "QF",    slotA: { label: "Zw. M95" },            slotB: { label: "Zw. M96" } },

  // ── Semi-finals ───────────────────────────────────────────
  { id: "M101", stage: "SF",    slotA: { label: "Zw. M97" },            slotB: { label: "Zw. M98" } },
  { id: "M102", stage: "SF",    slotA: { label: "Zw. M99" },            slotB: { label: "Zw. M100" } },

  // ── Third place ───────────────────────────────────────────
  { id: "M103", stage: "3rd",   slotA: { label: "Prz. M101" },          slotB: { label: "Prz. M102" } },

  // ── Final ─────────────────────────────────────────────────
  { id: "M104", stage: "final", slotA: { label: "Zw. M101" },           slotB: { label: "Zw. M102" } },
];

export const STAGE_LABELS: Record<string, string> = {
  R32:   "1/16 finału",
  R16:   "1/8 finału",
  QF:    "Ćwierćfinał",
  SF:    "Półfinał",
  "3rd": "Mecz o 3. miejsce",
  final: "Finał",
};

export const STAGE_ORDER = ["R32", "R16", "QF", "SF", "3rd", "final"] as const;
