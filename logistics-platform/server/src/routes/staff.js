import { Router } from "express";
import { z } from "zod";
import {
  requireRegisteredUser,
  verifySupabaseToken,
  requireRole
} from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Staff } from "../models/Staff.js";
import { User } from "../models/User.js";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Auto-generate a staff ID like "STF-042" */
async function generateStaffId() {
  const count = await Staff.count();
  return `STF-${String(count + 1).padStart(3, "0")}`;
}

// ── Validation schemas ────────────────────────────────────────────────────────

const createStaffSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  department: z.enum(["dispatch", "warehouse", "customer_support", "management", "driver"]),
  jobTitle: z.string().min(2).optional(),
  emergencyContact: z
    .object({ name: z.string(), phone: z.string() })
    .optional(),
  dateOfJoining: z.coerce.date().optional()
});

const updateStaffSchema = z.object({
  department: z
    .enum(["dispatch", "warehouse", "customer_support", "management", "driver"])
    .optional(),
  jobTitle: z.string().min(2).optional(),
  emergencyContact: z
    .object({ name: z.string(), phone: z.string() })
    .optional(),
  isActive: z.boolean().optional()
});

// ── All routes require auth ───────────────────────────────────────────────────
router.use(verifySupabaseToken, requireRegisteredUser);

// ── GET /api/staff  —  list all staff (admin only) ───────────────────────────
router.get("/", requireRole("admin"), async (req, res) => {
  try {
    const { department, isActive } = req.query;
    const criteria = {};
    if (department) criteria.department = department;
    if (isActive !== undefined) criteria.isActive = isActive === "true";

    const staff = await Staff.find(criteria, {
      populate: ["userId"],
      orderBy: "createdAt desc"
    });

    res.json(staff);
  } catch (err) {
    console.error("Failed to fetch staff:", err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

// ── GET /api/staff/me  —  fetch own staff profile ────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const profile = await Staff.findOne({ userId: req.user.id });
    // Manually populate user data for the staff record
    if (profile) {
      const user = await (await import("../models/User.js")).User.findById(profile.userId);
      if (user) profile.userId = user;
    }
    if (!profile) return res.status(404).json({ message: "Staff profile not found" });
    res.json(profile);
  } catch (err) {
    console.error("Failed to fetch staff profile:", err);
    res.status(500).json({ message: "Failed to fetch staff profile" });
  }
});

// ── GET /api/staff/:id  —  single staff record (admin only) ──────────────────
router.get("/:id", requireRole("admin"), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json(staff);
  } catch (err) {
    console.error("Failed to fetch staff member:", err);
    res.status(500).json({ message: "Failed to fetch staff member" });
  }
});

// ── POST /api/staff  —  create a staff record (admin only) ───────────────────
router.post(
  "/",
  requireRole("admin"),
  validateBody(createStaffSchema),
  async (req, res) => {
    try {
      const user = await User.findById(req.body.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const existing = await Staff.findOne({ userId: req.body.userId });
      if (existing)
        return res.status(409).json({ message: "Staff profile already exists for this user" });

      const staffId = await generateStaffId();
      const staff = await Staff.create({ ...req.body, staffId });

      res.status(201).json(staff);
    } catch (err) {
      console.error("Failed to create staff record:", err);
      res.status(500).json({ message: "Failed to create staff record" });
    }
  }
);

// ── PUT /api/staff/:id  —  update a staff record (admin only) ────────────────
router.put(
  "/:id",
  requireRole("admin"),
  validateBody(updateStaffSchema),
  async (req, res) => {
    try {
      const staff = await Staff.findByIdAndUpdate(req.params.id, req.body);
      if (!staff) return res.status(404).json({ message: "Staff member not found" });
      res.json(staff);
    } catch (err) {
      console.error("Failed to update staff record:", err);
      res.status(500).json({ message: "Failed to update staff record" });
    }
  }
);

// ── DELETE /api/staff/:id  —  remove a staff record (admin only) ─────────────
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    await Staff.deleteById(req.params.id);
    res.json({ message: "Staff record deleted" });
  } catch (err) {
    console.error("Failed to delete staff record:", err);
    res.status(500).json({ message: "Failed to delete staff record" });
  }
});

export default router;
