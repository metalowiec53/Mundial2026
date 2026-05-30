import { getAdminDb } from "./admin";
import type { User } from "@/lib/types";

export async function getUserById(userId: string): Promise<User | null> {
  const doc = await getAdminDb().collection("users").doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as User;
}

export async function getAllUsers(): Promise<Array<{ id: string; name: string }>> {
  const snapshot = await getAdminDb().collection("users").orderBy("name").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: (doc.data() as User).name,
  }));
}
