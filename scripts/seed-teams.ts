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

interface TeamData {
  id: string;
  name: string;
  shortCode: string;
  flagUrl: string;
  groupId: string;
  eliminated: boolean;
}

async function main(): Promise<void> {
  loadEnvLocal();

  const { getAdminDb } = await import("../lib/firebase/admin.js");

  const teamsPath = resolve(process.cwd(), "scripts/data/teams.json");
  const teams = JSON.parse(readFileSync(teamsPath, "utf8")) as TeamData[];

  const db = getAdminDb();
  const batch = db.batch();

  for (const team of teams) {
    const { id, ...data } = team;
    batch.set(db.collection("teams").doc(id), data);
  }

  await batch.commit();
  console.log(`Zaseedowano ${teams.length} drużyn.`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
