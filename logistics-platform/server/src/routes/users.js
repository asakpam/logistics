import { Router } from "express";
import { z } from "zod";
import { requireRegisteredUser, verifySupabaseToken, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { Driver } from "../models/Driver.js";
import { Shipment } from "../models/Shipment.js";
import { supabase } from "../config/db.js";

const router = Router();

const statusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "suspended", "active", "inactive"])
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["customer", "admin"]).optional(),
  status: z.enum(["pending", "approved", "rejected", "suspended", "active", "inactive"]).optional(),
  address: z.object({
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    country: z.string().optional().nullable()
  }).optional(),
  newPassword: z.string().min(6).optional()
});

router.use(verifySupabaseToken, requireRegisteredUser);

// GET /api/users — Admin view all registered users
router.get("/", requireRole("admin"), async (req, res) => {
  try {
    const criteria = {};
    if (req.query.role) criteria.role = req.query.role;
    const users = await User.find(criteria, { orderBy: "createdAt desc" });

    // Attach shipment count for each user
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        let shipmentCount = 0;
        try {
          shipmentCount = await Shipment.count({ customerId: u.id });
        } catch {}
        return {
          ...u,
          shipmentCount,
          shipments: shipmentCount
        };
      })
    );

    res.json(usersWithCounts);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET /api/users/:id — Admin view single user details
router.get("/:id", requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let shipmentCount = 0;
    try {
      shipmentCount = await Shipment.count({ customerId: user.id });
    } catch {}

    res.json({
      ...user,
      shipmentCount,
      shipments: shipmentCount
    });
  } catch (err) {
    console.error("Failed to fetch user details:", err);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

// PUT /api/users/:id — Admin edit user profile info (name, phone, address, status, optional password)
router.put("/:id", requireRole("admin"), validateBody(updateUserSchema), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.status !== undefined) {
      updates.status = req.body.status;
      updates.isActive = !["suspended", "inactive", "rejected"].includes(req.body.status);
    }
    if (req.body.address !== undefined) {
      updates.address = req.body.address;
    }

    const updatedUser = await User.findByIdAndUpdate(user.id, updates);

    // If new password provided and user has authId, securely update password in Supabase Auth
    if (req.body.newPassword && user.authId) {
      try {
        const { error: authErr } = await supabase.auth.admin.updateUserById(user.authId, {
          password: req.body.newPassword
        });
        if (authErr) {
          console.error("Failed to update user password in auth:", authErr);
        }
      } catch (pwErr) {
        console.error("Password update error:", pwErr);
      }
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// PATCH /api/users/:id/status — Admin update user status (Approve/Reject/Suspend)
router.patch("/:id/status", requireRole("admin"), validateBody(statusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isActive = !["suspended", "inactive", "rejected"].includes(status);

    const updatedUser = await User.findByIdAndUpdate(user.id, { status, isActive });

    // If user is a driver, also update Driver document
    if (user.role === "driver") {
      const driverStatus = status === "active" ? "approved" : status;
      const existingDriver = await Driver.findByUserId(user.id);
      if (existingDriver) {
        await Driver.findByIdAndUpdate(existingDriver.id, {
          status: driverStatus,
          isAvailable: driverStatus === "approved"
        });
      }
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Failed to update user status:", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// DELETE /api/users/:id — Admin delete user safely
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const targetId = req.params.id;
    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Prevent admin from deleting their own account
    if (req.user.id === user.id) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    // 2. Prevent removing the only administrator
    if (user.role === "admin") {
      const allAdmins = await User.find({ role: "admin" });
      const activeAdmins = allAdmins.filter(a => a.isActive);
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ message: "Cannot delete the only administrator account." });
      }
    }

    // 3. Inspect related shipments
    let shipmentCount = 0;
    try {
      shipmentCount = await Shipment.count({ customerId: user.id });
    } catch {}

    // Safely soft delete user so historical logistics/shipment records are preserved
    await User.softDelete(user.id);

    // Also remove or disable Supabase Auth user so they cannot log in
    if (user.authId) {
      try {
        await supabase.auth.admin.deleteUser(user.authId);
      } catch (authErr) {
        console.warn("Could not delete auth user:", authErr.message);
      }
    }

    res.json({
      message: "User deleted successfully",
      preservedShipments: shipmentCount
    });
  } catch (err) {
    console.error("Failed to delete user:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router;
