import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  let i = 0;

  while (i < content.length) {
    // skip whitespace and blank lines
    while (i < content.length && (content[i] === "\n" || content[i] === "\r" || content[i] === " ")) i++;
    if (i >= content.length) break;

    // skip comments
    if (content[i] === "#") {
      while (i < content.length && content[i] !== "\n") i++;
      continue;
    }

    // read key
    const keyStart = i;
    while (i < content.length && content[i] !== "=" && content[i] !== "\n") i++;
    if (i >= content.length || content[i] !== "=") continue;
    const key = content.slice(keyStart, i).trim();
    i++; // skip =

    // read value — handle single-quoted multiline values
    let value = "";
    if (content[i] === "'" || content[i] === '"') {
      const quote = content[i];
      i++;
      const start = i;
      while (i < content.length && content[i] !== quote) i++;
      value = content.slice(start, i);
      if (i < content.length) i++; // skip closing quote
    } else {
      const start = i;
      while (i < content.length && content[i] !== "\n" && content[i] !== "\r") i++;
      value = content.slice(start, i).trim();
    }

    if (key && !process.env[key]) process.env[key] = value;
  }
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main(): Promise<void> {
  loadEnvLocal();

  const args = process.argv.slice(2);
  const isAdmin = args.includes("--admin");
  const rest = args.filter((a) => a !== "--admin");

  const name = rest[0];
  const pin = rest[1];

  if (!name || !pin) {
    console.error('Użycie: npm run create-user -- "Imię" 1234 [--admin]');
    process.exit(1);
  }

  if (!/^\d{4}$/.test(pin)) {
    console.error("PIN musi mieć dokładnie 4 cyfry");
    process.exit(1);
  }

  const { default: bcrypt } = await import("bcryptjs");
  const { getAdminDb } = await import("../lib/firebase/admin.js");

  const userId = nameToSlug(name);
  const db = getAdminDb();

  const existing = await db.collection("users").doc(userId).get();
  if (existing.exists) {
    console.error(`Użytkownik "${name}" (id: ${userId}) już istnieje`);
    process.exit(1);
  }

  const pinHash = await bcrypt.hash(pin, 10);

  await db.collection("users").doc(userId).set({
    name,
    pinHash,
    photoUrl: "",
    isAdmin,
    createdAt: new Date(),
  });

  console.log(`Utworzono "${name}" (id: ${userId})${isAdmin ? " [admin]" : ""}`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
