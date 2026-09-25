import { supabase } from "../config/db.js";
import { Driver } from "../models/Driver.js";
import { Shipment } from "../models/Shipment.js";
import { User } from "../models/User.js";

async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing auth token"));

    // Allow public tracking / demo tokens
    if (token === "public" || token === "demo-token") {
      socket.user = { id: "demo-user", role: "customer", isDemo: true };
      return next();
    }

    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
    if (error || !sbUser) return next(new Error("Invalid auth token"));

    const user = await User.findByAuthId(sbUser.id);
    if (!user || user.isActive === false) return next(new Error("User not active"));

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Invalid auth token"));
  }
}

export function registerTrackingSocket(io) {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.on("shipment:join", async ({ trackingNumber }) => {
      if (!trackingNumber) return;
      const shipment = await Shipment.findOne({ trackingNumber });
      if (!shipment) return;

      const userId = socket.user?.id || socket.user?._id;
      const isOwner = shipment.customerId === userId;
      const isAdmin = socket.user?.role === "admin";
      const isDriver = socket.user?.role === "driver";
      const isPublic = socket.user?.isDemo;

      if (!isOwner && !isAdmin && !isDriver && !isPublic) return;

      socket.join(`shipment:${trackingNumber}`);
    });

    socket.on("driver:location", async ({ trackingNumber, latitude, longitude }) => {
      if (!trackingNumber || latitude == null || longitude == null) return;
      const shipment = await Shipment.findOne({ trackingNumber });
      if (!shipment) return;

      const userId = socket.user?.id || socket.user?._id;
      const driver = await Driver.findByUserId(userId);
      if (!driver || (shipment.driverId && shipment.driverId !== driver.id)) return;

      await Promise.all([
        Shipment.updateLocation(shipment.id, latitude, longitude),
        Driver.updateLocation(driver.id, latitude, longitude)
      ]);

      io.to(`shipment:${trackingNumber}`).emit("shipment:locationUpdate", {
        trackingNumber,
        latitude,
        longitude,
        updatedAt: new Date().toISOString()
      });
    });
  });
}
