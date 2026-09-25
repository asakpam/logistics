import { Router } from "express";
import { z } from "zod";
import { requireRegisteredUser, verifySupabaseToken, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Driver } from "../models/Driver.js";
import { Shipment, SHIPMENT_STATUSES } from "../models/Shipment.js";
import { User } from "../models/User.js";
import { computeEta, computeBasicEta } from "../services/etaService.js";
import { notifyStatusChange } from "../services/notificationService.js";
import { generateTrackingNumber } from "../services/trackingNumber.js";

const router = Router();

const createShipmentSchema = z.object({
  pickupAddress: z.string().min(3),
  destinationAddress: z.string().min(3),
  receiverName: z.string().min(2),
  receiverPhone: z.string().min(7),
  packageType: z.string().min(2),
  weight: z.coerce.number().positive(),
  deliveryFee: z.coerce.number().min(0).default(0),
  pickupDate: z.coerce.date().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  note: z.string().optional()
});

const assignDriverSchema = z.object({
  driverId: z.string().min(1)
});

// ── Public tracking endpoint (no auth required) ──────────────────────────────
router.get("/track/:trackingNumber", async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });
    // Return only safe fields
    const { id, trackingNumber, status, currentLatitude, currentLongitude,
            estimatedArrival, pickupAddress, destinationAddress,
            receiverName, receiverPhone, packageType, weight, createdAt } = shipment;
    res.json({ id, trackingNumber, status, currentLatitude, currentLongitude,
               estimatedArrival, pickupAddress, destinationAddress,
               receiverName, receiverPhone, packageType, weight, createdAt });
  } catch {
    res.status(500).json({ message: "Failed to fetch shipment" });
  }
});

router.use(verifySupabaseToken, requireRegisteredUser);

// POST /api/shipments — Create new shipment
router.post("/", requireRole("customer", "admin"), validateBody(createShipmentSchema), async (req, res) => {
  try {
    let estimatedArrival;
    try {
      estimatedArrival = await computeEta({
        weight:             req.body.weight,
        pickupAddress:      req.body.pickupAddress,
        destinationAddress: req.body.destinationAddress,
        pickupDate:         req.body.pickupDate,
      });
    } catch {
      estimatedArrival = computeBasicEta({ weight: req.body.weight });
    }

    const shipment = await Shipment.create({
      ...req.body,
      customerId:     req.user.id,
      trackingNumber: generateTrackingNumber(),
      estimatedArrival,
    });

    // Add initial status history entry
    await Shipment.addStatusHistory(shipment.id, "Pending", null, req.user.id);

    res.status(201).json(shipment);
  } catch (err) {
    console.error("Create shipment error:", err);
    res.status(500).json({ message: "Failed to create shipment" });
  }
});

// GET /api/shipments — List shipments (filtered by role)
router.get("/", async (req, res) => {
  try {
    let shipments = [];

    if (req.user.role === "admin") {
      // Admin sees ALL shipments with customer and driver details populated
      shipments = await Shipment.find({}, {
        populate: ["customerId", "driverId"],
        orderBy: "createdAt desc"
      });
    } else if (req.user.role === "driver") {
      // Driver sees:
      // 1. Shipments assigned to this driver
      // 2. Unassigned 'Pending' shipments (available for delivery)
      const driver = await Driver.findByUserId(req.user.id);
      if (!driver) {
        return res.json([]);
      }

      const { type } = req.query;
      if (type === "assigned") {
        shipments = await Shipment.find(
          { driverId: driver.id },
          { populate: ["customerId", "driverId"], orderBy: "createdAt desc" }
        );
      } else if (type === "available") {
        shipments = await Shipment.find(
          { driverId: null, status: "Pending" },
          { populate: ["customerId", "driverId"], orderBy: "createdAt desc" }
        );
      } else {
        // Return both assigned and available matching Supabase RLS policy
        const filter = `driver_id.eq.${driver.id},and(driver_id.is.null,status.eq.Pending)`;
        shipments = await Shipment.find(
          {},
          { or: filter, populate: ["customerId", "driverId"], orderBy: "createdAt desc" }
        );
      }
    } else {
      // Customer sees ONLY their own shipments (with assigned driver details)
      shipments = await Shipment.find(
        { customerId: req.user.id },
        { populate: ["driverId"], orderBy: "createdAt desc" }
      );
    }

    res.json(shipments);
  } catch (err) {
    console.error("List shipments error:", err);
    res.status(500).json({ message: "Failed to fetch shipments" });
  }
});

// GET /api/shipments/:id — Get single shipment
router.get("/:id", async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id, {
      populate: ["customerId", "driverId"]
    });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    // Authorization check
    let allowed = req.user.role === "admin";
    if (!allowed && req.user.role === "customer") {
      const custId = typeof shipment.customerId === "object" ? shipment.customerId?.id : shipment.customerId;
      allowed = custId === req.user.id;
    }
    if (!allowed && req.user.role === "driver") {
      const driver = await Driver.findByUserId(req.user.id);
      if (driver) {
        const assignedDriverId = typeof shipment.driverId === "object" ? shipment.driverId?.id : shipment.driverId;
        allowed = assignedDriverId === driver.id || (!assignedDriverId && shipment.status === "Pending");
      }
    }

    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(shipment);
  } catch (err) {
    console.error("Get shipment error:", err);
    res.status(500).json({ message: "Failed to fetch shipment" });
  }
});

// PUT /api/shipments/:id/status — Update shipment status
router.put("/:id/status", validateBody(updateStatusSchema), async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    // Check authorization: admin or the assigned driver
    let canUpdate = req.user.role === "admin";
    if (!canUpdate && req.user.role === "driver" && shipment.driverId) {
      const assignedDriver = await Driver.findById(shipment.driverId);
      canUpdate = assignedDriver?.userId === req.user.id;
    }

    if (!canUpdate) return res.status(403).json({ message: "Access denied" });

    const updated = await Shipment.findByIdAndUpdate(shipment.id, { status: req.body.status });

    // Record status history
    await Shipment.addStatusHistory(shipment.id, req.body.status, req.body.note || null, req.user.id);

    const customerId = typeof shipment.customerId === "object" ? shipment.customerId.id : shipment.customerId;
    const customer = await User.findById(customerId);
    if (customer) await notifyStatusChange({ shipment: updated, customer });

    res.json(updated);
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Failed to update shipment status" });
  }
});

// PUT /api/shipments/:id/assign — Admin assigns driver to shipment
router.put("/:id/assign", requireRole("admin"), validateBody(assignDriverSchema), async (req, res) => {
  try {
    const [shipment, driver] = await Promise.all([
      Shipment.findById(req.params.id),
      Driver.findById(req.body.driverId)
    ]);

    if (!shipment) return res.status(404).json({ message: "Shipment not found" });
    if (!driver)   return res.status(404).json({ message: "Driver not found" });

    const updated = await Shipment.findByIdAndUpdate(shipment.id, {
      driverId: driver.id,
      status:   "Assigned"
    });

    await Shipment.addStatusHistory(shipment.id, "Assigned", "Driver assigned by admin", req.user.id);

    const customerId = typeof shipment.customerId === "object" ? shipment.customerId.id : shipment.customerId;
    const customer = await User.findById(customerId);
    if (customer) await notifyStatusChange({ shipment: updated, customer });

    res.json(updated);
  } catch (err) {
    console.error("Assign driver error:", err);
    res.status(500).json({ message: "Failed to assign driver" });
  }
});

// PUT /api/shipments/:id/accept — Approved driver accepts an available pending shipment
router.put("/:id/accept", requireRole("driver"), async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    if (!driver || driver.status !== "approved") {
      return res.status(403).json({ message: "Driver profile is not approved" });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });
    if (shipment.driverId) {
      return res.status(400).json({ message: "Shipment is already assigned to a driver" });
    }
    if (shipment.status !== "Pending") {
      return res.status(400).json({ message: "Shipment is not available for assignment" });
    }

    const updated = await Shipment.findByIdAndUpdate(shipment.id, {
      driverId: driver.id,
      status: "Assigned"
    });

    await Shipment.addStatusHistory(shipment.id, "Assigned", `Accepted by driver ${req.user.name || ""}`, req.user.id);

    const customerId = typeof shipment.customerId === "object" ? shipment.customerId.id : shipment.customerId;
    const customer = await User.findById(customerId);
    if (customer) await notifyStatusChange({ shipment: updated, customer });

    res.json(updated);
  } catch (err) {
    console.error("Accept shipment error:", err);
    res.status(500).json({ message: "Failed to accept shipment" });
  }
});

export default router;
