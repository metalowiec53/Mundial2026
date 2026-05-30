import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var is not set");

  return initializeApp({
    credential: cert(JSON.parse(raw) as Parameters<typeof cert>[0]),
  });
}

export const getAdminDb = () => getFirestore(getAdminApp());
