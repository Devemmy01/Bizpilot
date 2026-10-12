import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { readFileSync } from "fs";
import { resolve } from "path";

function getServiceAccount() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!rawServiceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
  }

  let serviceAccount;
  if (rawServiceAccount.trim().startsWith("{")) {
    serviceAccount = JSON.parse(rawServiceAccount);
  } else {
    // Resolve relative or absolute file path
    const filePath = resolve(process.cwd(), rawServiceAccount.trim());
    const fileContent = readFileSync(filePath, "utf8");
    serviceAccount = JSON.parse(fileContent);
  }

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return serviceAccount;
}

export function getFirebaseAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(getServiceAccount()),
    });
  }

  return getAuth();
}

export async function verifyFirebaseBearerToken(authHeader: string | null) {
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return null;
  }

  try {
    return await getFirebaseAdminAuth().verifyIdToken(token);
  } catch (error) {
    console.error("Firebase auth verify failed:", error);
    return null;
  }
}
