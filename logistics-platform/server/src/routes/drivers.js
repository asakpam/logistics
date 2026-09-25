import { Router } from "express";
import { z } from "zod";
import { requireRegisteredUser, verifySupabaseToken, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Driver } from "../models/Driver.js";
import { User } from "../models/User.js";
import { getSignedUrl } from "../middleware/upload.js";
import path from "path";
import fs from "fs";

const router = Router();

const driverProfileSchema = z.object({
  licenseNumber: z.string().min(2),
  vehicleNumber: z.string().min(2),
  vehicleType: z.string().optional()
});

const statusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "suspended"])
});

router.use(verifySupabaseToken, requireRegisteredUser);

// GET /api/drivers — Admin list all drivers (with joined user data)
router.get("/", requireRole("admin"), async (req, res) => {
  try {
    const drivers = await Driver.find({}, { populate: ["userId"], orderBy: "createdAt desc" });
    res.json(drivers);
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

// GET /api/drivers/available — Admin: strictly APPROVED & available drivers for assignment
router.get("/available", requireRole("admin"), async (req, res) => {
  try {
    const drivers = await Driver.find(
      { status: "approved", isAvailable: true },
      { populate: ["userId"] }
    );

    // Filter out drivers whose User record is not approved/active
    const approvedDrivers = drivers.filter(d =>
      d.userId && (d.userId.status === "approved" || d.userId.status === "active") && d.userId.isActive !== false
    );

    res.json(approvedDrivers);
  } catch (err) {
    console.error("Failed to fetch available drivers:", err);
    res.status(500).json({ message: "Failed to fetch available drivers" });
  }
});

// GET /api/drivers/:id/ghana-card-url — Admin: get signed URL for Ghana Card (JSON response)
// Use this from the frontend via api.get() with Authorization header, then display the returned URL in <img src>
router.get("/:id/ghana-card-url", requireRole("admin"), async (req, res) => {
  try {
    let driver = await Driver.findById(req.params.id);
    if (!driver) driver = await Driver.findByUserId(req.params.id);
    if (!driver || !driver.ghanaCardImage) {
      return res.status(404).json({ message: "Ghana Card image not found" });
    }

    if (process.env.SUPABASE_URL) {
      try {
        const signedUrl = await getSignedUrl(driver.ghanaCardImage, 3600);
        return res.json({ signedUrl, path: driver.ghanaCardImage });
      } catch (error) {
        console.error("Error creating signed URL:", error);
        return res.status(500).json({ message: "Failed to generate signed URL for Ghana Card" });
      }
    } else {
      // Local storage fallback: return the local file path as URL
      return res.json({ signedUrl: `/uploads/ghana-cards/${driver.ghanaCardImage}`, path: driver.ghanaCardImage });
    }
  } catch (err) {
    console.error("Ghana Card URL retrieval error:", err);
    res.status(500).json({ message: "Failed to retrieve Ghana Card image URL" });
  }
});

// GET /api/drivers/:id/ghana-card — Admin view Ghana Card image (secure)
router.get("/:id/ghana-card", requireRole("admin"), async (req, res) => {
  try {
    let driver = await Driver.findById(req.params.id);
    if (!driver) driver = await Driver.findByUserId(req.params.id);
    if (!driver || !driver.ghanaCardImage) {
      return res.status(404).json({ message: "Ghana Card image not found" });
    }

    if (process.env.SUPABASE_URL) {
      try {
        const signedUrl = await getSignedUrl(driver.ghanaCardImage, 3600);
        return res.redirect(signedUrl);
      } catch (error) {
        console.error("Error getting signed URL:", error);
        return res.status(500).json({ message: "Failed to retrieve Ghana Card image from storage" });
      }
    } else {
      const imagePath = path.join(process.cwd(), "uploads", "ghana-cards", driver.ghanaCardImage);
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ message: "Ghana Card image file not found" });
      }
      res.set({
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.sendFile(imagePath);
    }
  } catch (err) {
    console.error("Ghana Card retrieval error:", err);
    res.status(500).json({ message: "Failed to retrieve Ghana Card image" });
  }
});

// POST /api/drivers/me — Driver updates own vehicle/license details
router.post("/me", requireRole("driver"), validateBody(driverProfileSchema), async (req, res) => {
  try {
    const existing = await Driver.findByUserId(req.user.id);
    let driver;
    if (existing) {
      driver = await Driver.findByIdAndUpdate(existing.id, req.body);
    } else {
      driver = await Driver.create({ ...req.body, userId: req.user.id, status: "pending" });
    }
    res.status(201).json(driver);
  } catch (err) {
    console.error("Failed to update driver details:", err);
    res.status(500).json({ message: "Failed to update driver details" });
  }
});

// PATCH /api/drivers/:id/approve — Admin approve a driver
router.patch("/:id/approve", requireRole("admin"), async (req, res) => {
  try {
    let driver = await Driver.findById(req.params.id);
    if (!driver) driver = await Driver.findByUserId(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver profile not found" });

    const updatedDriver = await Driver.findByIdAndUpdate(driver.id, {
      status: "approved",
      isAvailable: true
    });

    await User.findByIdAndUpdate(driver.userId, { status: "approved", isActive: true });

    res.json({ message: "Driver approved successfully", driver: updatedDriver });
  } catch (err) {
    console.error("Failed to approve driver:", err);
    res.status(500).json({ message: "Failed to approve driver" });
  }
});

// PATCH /api/drivers/:id/reject — Admin reject a driver
router.patch("/:id/reject", requireRole("admin"), async (req, res) => {
  try {
    let driver = await Driver.findById(req.params.id);
    if (!driver) driver = await Driver.findByUserId(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver profile not found" });

    const updatedDriver = await Driver.findByIdAndUpdate(driver.id, {
      status: "rejected",
      isAvailable: false
    });

    await User.findByIdAndUpdate(driver.userId, { status: "rejected", isActive: false });

    res.json({ message: "Driver application rejected", driver: updatedDriver });
  } catch (err) {
    console.error("Failed to reject driver:", err);
    res.status(500).json({ message: "Failed to reject driver" });
  }
});

// PATCH /api/drivers/:id/status — Admin update driver status
router.patch("/:id/status", requireRole("admin"), validateBody(statusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    let driver = await Driver.findById(req.params.id);
    if (!driver) driver = await Driver.findByUserId(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver profile not found" });

    const updatedDriver = await Driver.findByIdAndUpdate(driver.id, {
      status,
      isAvailable: status === "approved"
    });

    await User.findByIdAndUpdate(driver.userId, {
      status: status === "approved" ? "approved" : status,
      isActive: status === "approved"
    });

    res.json({ message: `Driver status updated to ${status}`, driver: updatedDriver });
  } catch (err) {
    console.error("Failed to update driver status:", err);
    res.status(500).json({ message: "Failed to update driver status" });
  }
});

export default router;
