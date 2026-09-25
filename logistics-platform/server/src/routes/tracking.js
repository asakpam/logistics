import { Router } from "express";
import { z } from "zod";
import { requireRegisteredUser, verifySupabaseToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Driver } from "../models/Driver.js";
import { Shipment } from "../models/Shipment.js";

const router = Router();

const locationSchema = z.object({
  trackingNumber: z.string().min(6),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

// GET /api/tracking/:trackingNumber — Public tracking lookup
router.get("/:trackingNumber", async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const { trackingNumber, status, currentLatitude, currentLongitude,
            estimatedArrival, pickupAddress, destinationAddress } = shipment;
    res.json({ trackingNumber, status, currentLatitude, currentLongitude,
               estimatedArrival, pickupAddress, destinationAddress });
  } catch (err) {
    console.error("Tracking lookup error:", err);
    res.status(500).json({ message: "Failed to fetch tracking info" });
  }
});

// POST /api/tracking/location — Driver updates live location
router.post("/location", verifySupabaseToken, requireRegisteredUser, validateBody(locationSchema), async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingNumber: req.body.trackingNumber });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const driver = await Driver.findByUserId(req.user.id);
    if (!driver || shipment.driverId !== driver.id) {
      return res.status(403).json({ message: "Only the assigned driver can update this location" });
    }

    const { latitude, longitude } = req.body;

    // Update shipment and driver location in parallel
    const [updatedShipment] = await Promise.all([
      Shipment.updateLocation(shipment.id, latitude, longitude),
      Driver.updateLocation(driver.id, latitude, longitude),
    ]);

    res.json({ message: "Location updated", shipment: updatedShipment });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ message: "Failed to update location" });
  }
});

export default router;
