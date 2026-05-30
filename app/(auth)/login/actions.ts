"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getUserById } from "@/lib/firebase/users";
import { createSession } from "@/lib/auth";

const RL_COOKIE = "mundial_rl";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

interface RLState {
  attempts: number;
  lockedUntil?: number;
}

async function readRL(): Promise<RLState> {
  const jar = await cookies();
  const raw = jar.get(RL_COOKIE)?.value;
  if (!raw) return { attempts: 0 };
  try {
    return JSON.parse(raw) as RLState;
  } catch {
    return { attempts: 0 };
  }
}

async function writeRL(state: RLState): Promise<void> {
  const jar = await cookies();
  jar.set(RL_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });
}

export async function loginAction(
  userId: string,
  pin: string
): Promise<{ error: string } | void> {
  const rl = await readRL();

  if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
    const remaining = Math.ceil((rl.lockedUntil - Date.now()) / 1000);
    return { error: `Za dużo prób. Poczekaj ${remaining} s.` };
  }

  const user = await getUserById(userId);
  if (!user) return { error: "Zły PIN" };

  const valid = await bcrypt.compare(pin, user.pinHash);

  if (!valid) {
    const newAttempts = rl.attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      await writeRL({ attempts: 0, lockedUntil: Date.now() + LOCKOUT_MS });
    } else {
      await writeRL({ attempts: newAttempts });
    }
    return { error: "Zły PIN" };
  }

  await writeRL({ attempts: 0 });
  await createSession(userId, user.isAdmin);
  redirect("/");
}
