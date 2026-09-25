import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import driverRoutes from "./routes/drivers.js";
import productRoutes from "./routes/products.js";
import reportsRoutes from "./routes/reports.js";
import shipmentRoutes from "./routes/shipments.js";
import staffRoutes from "./routes/staff.js";
import trackingRoutes from "./routes/tracking.js";
import userRoutes from "./routes/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://localhost:5173",
  ].filter(Boolean);
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files (Ghana Card images) - admin only
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "logistics-platform" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/shipments", shipmentRoutes);
  app.use("/api/tracking", trackingRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/reports", reportsRoutes);

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
