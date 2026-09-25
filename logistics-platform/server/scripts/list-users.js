import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import "dotenv/config";
import mongoose from "mongoose";

async function run() {
  try {
    console.log("Connecting to:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log("Connected to MongoDB!");
    
    const users = await mongoose.connection.db.collection("users").find({}).toArray();
    console.log("\n=== ALL USERS IN DB ===");
    console.log(JSON.stringify(users, null, 2));
    console.log("=======================\n");
  } catch (err) {
    console.error("Error connecting/querying MongoDB:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
