import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { resolve } from "path";

let cachedApp = null;
let cachedAuth = null;

export function getFirebaseAdmin() {
  if (cachedAuth) {
    return {
      auth: () => cachedAuth,
      app: () => cachedApp,
    };
  }

  const apps = getApps();
  if (apps.length) {
    cachedApp = apps[0];
    cachedAuth = getAuth(cachedApp);
    return {
      auth: () => cachedAuth,
      app: () => cachedApp,
    };
  }

  let serviceAccount;

  // ── Option 1: Load from a JSON key file ───────────────────────────────────
  const keyFilePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyFilePath) {
    try {
      const absolutePath = resolve(process.cwd(), keyFilePath);
      const raw = readFileSync(absolutePath, "utf-8");
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      console.warn("Could not read FIREBASE_SERVICE_ACCOUNT_PATH:", e.message);
    }
  }

  // ── Option 2: Inline JSON string in env var ───────────────────────────────
  if (!serviceAccount) {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (rawJson && rawJson.trim().length > 0) {
      try {
        serviceAccount = JSON.parse(rawJson);
      } catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
      }
    }
  }

  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in server/.env"
    );
  }

  cachedApp = initializeApp({
    credential: cert(serviceAccount),
  });
  cachedAuth = getAuth(cachedApp);

  return {
    auth: () => cachedAuth,
    app: () => cachedApp,
  };
}
