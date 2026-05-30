export const dynamic = "force-dynamic";

import { getAllUsers } from "@/lib/firebase/users";
import LoginClient from "./login-client";

export default async function LoginPage() {
  const users = await getAllUsers();
  return <LoginClient users={users} />;
}
