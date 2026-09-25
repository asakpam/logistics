/**
 * Diagnostic script — checks what's in MongoDB for all users
 * Run: node scripts/check-user.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("No MONGODB_URI in .env"); process.exit(1); }

await mongoose.connect(MONGODB_URI);
console.log("✅ Connected to MongoDB\n");

const users = await mongoose.connection.db
  .collection("users")
  .find({})
  .toArray();

if (users.length === 0) {
  console.log("⚠️  No users found in the 'users' collection.");
  console.log("   This means your admin account exists in Firebase but NOT in MongoDB.");
  console.log("   You must register through the app OR manually insert the user document.\n");
} else {
  console.log(`Found ${users.length} user(s):\n`);
  users.forEach(u => {
    console.log(`  Name:        ${u.name}`);
    console.log(`  Email:       ${u.email}`);
    console.log(`  Role:        ${u.role}`);
    console.log(`  isActive:    ${u.isActive}`);
    console.log(`  firebaseUid: ${u.firebaseUid}`);
    console.log("  ─────────────────────────────");
  });
}

await mongoose.disconnect();
