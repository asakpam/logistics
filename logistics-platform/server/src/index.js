import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { registerTrackingSocket } from "./socket/trackingSocket.js";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" }
});

registerTrackingSocket(io);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`\n🚀 Logistics Server running on http://localhost:${port}`);
  
  connectDatabase()
    .then(() => {
      console.log("✅ Supabase connected successfully!");
    })
    .catch((error) => {
      console.error("\n⚠️ Supabase Connection Failed:", error.message);
      console.error("👉 Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in server/.env\n");
    });
});
