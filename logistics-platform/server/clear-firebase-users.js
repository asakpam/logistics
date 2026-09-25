/**
 * clear-firebase-users.js
 * Run with: node clear-firebase-users.js
 * Place this file in the server/ directory and run from there.
 */

import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

config();

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error("❌  FIREBASE_SERVICE_ACCOUNT_JSON is not set in server/.env");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch {
  console.error("❌  FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function deleteAllUsers() {
  let totalDeleted = 0;
  let nextPageToken;

  console.log("🔍  Fetching Firebase users...");

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    const uids = result.users.map((u) => u.uid);

    if (uids.length === 0) {
      console.log("✅  No users found in Firebase Auth.");
      break;
    }

    const deleteResult = await auth.deleteUsers(uids);
    totalDeleted += deleteResult.successCount;

    if (deleteResult.failureCount > 0) {
      deleteResult.errors.forEach((err) =>
        console.warn(`⚠️  Failed to delete uid ${err.index}: ${err.error.message}`)
      );
    }

    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`✅  Done. Deleted ${totalDeleted} Firebase Auth user(s).`);
  process.exit(0);
}

deleteAllUsers().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
