import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  let i = 0;
  while (i < content.length) {
    while (i < content.length && (content[i] === "\n" || content[i] === "\r" || content[i] === " ")) i++;
    if (i >= content.length) break;
    if (content[i] === "#") { while (i < content.length && content[i] !== "\n") i++; continue; }
    const keyStart = i;
    while (i < content.length && content[i] !== "=" && content[i] !== "\n") i++;
    if (i >= content.length || content[i] !== "=") continue;
    const key = content.slice(keyStart, i).trim();
    i++;
    let value = "";
    if (content[i] === "'" || content[i] === '"') {
      const q = content[i++];
      const s = i;
      while (i < content.length && content[i] !== q) i++;
      value = content.slice(s, i);
      if (i < content.length) i++;
    } else {
      const s = i;
      while (i < content.length && content[i] !== "\n" && content[i] !== "\r") i++;
      value = content.slice(s, i).trim();
    }
    if (key && !process.env[key]) process.env[key] = value;
  }
}

interface FixtureData {
  id: string;
  stage: "group";
  groupId: string;
  teamAId: string;
  teamBId: string;
  kickoff: string;
  status: "scheduled";
}

async function main(): Promise<void> {
  loadEnvLocal();

  const { getAdminDb } = await import("../lib/firebase/admin.js");
  const { Timestamp } = await import("firebase-admin/firestore");

  const fixturesPath = resolve(process.cwd(), "scripts/data/fixtures-group.json");
  const fixtures = JSON.parse(readFileSync(fixturesPath, "utf8")) as FixtureData[];

  const db = getAdminDb();
  const batch = db.batch();

  for (const fixture of fixtures) {
    const { id, kickoff, ...rest } = fixture;
    batch.set(db.collection("matches").doc(id), {
      ...rest,
      kickoff: Timestamp.fromDate(new Date(kickoff)),
    });
  }

  await batch.commit();
  console.log(`Zaseedowano ${fixtures.length} meczów.`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
