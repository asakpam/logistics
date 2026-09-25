import { Router } from "express";
import { z } from "zod";
import { requireRegisteredUser, verifySupabaseToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadGhanaCard, handleUploadError } from "../middleware/upload.js";
import { User } from "../models/User.js";
import { Driver } from "../models/Driver.js";

const router = Router();

// Helper to normalize address fields whether they arrive nested, bracketed, or flat
function normalizeRequestBody(body = {}) {
  const street = body.address?.street || body["address[street]"] || body.street || "";
  const city = body.address?.city || body["address[city]"] || body.city || "";
  const region = body.address?.region || body["address[region]"] || body.region || "";
  const digitalAddress = (body.digitalAddress || "").trim().toUpperCase();

  return {
    ...body,
    name: typeof body.name === "string" ? body.name.trim() : "",
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    role: body.role,
    street: typeof street === "string" ? street.trim() : "",
    city: typeof city === "string" ? city.trim() : "",
    region: typeof region === "string" ? region.trim() : "",
    digitalAddress,
    licenseNumber: typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : "",
    vehicleType: typeof body.vehicleType === "string" ? body.vehicleType.trim() : "Van",
    vehicleNumber: typeof body.vehicleNumber === "string" ? body.vehicleNumber.trim() : "",
  };
}

// Registration schema for customers (basic info only)
const customerRegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().min(7, "Valid phone number is required").optional().or(z.literal("")),
  role: z.literal("customer"),
  avatar: z.string().url().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
});

// Registration schema for drivers (extended info required)
const driverRegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().min(7, "Phone number is required for drivers"),
  role: z.literal("driver"),
  avatar: z.string().url().optional().or(z.literal("")),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "Region is required"),
  licenseNumber: z.string().min(2, "Driver's license number is required"),
  vehicleType: z.string().min(2, "Vehicle type is required"),
  vehicleNumber: z.string().min(2, "Vehicle number plate is required"),
  digitalAddress: z.string().refine(val => !val || /^[A-Z]{2}-\d{3,4}-\d{4}$/.test(val), {
    message: "Digital address must be in format: GA-001-1234"
  }).optional().or(z.literal("")),
});

router.post("/register", verifySupabaseToken, (req, res) => {
  // Always run multer first so it can parse multipart/form-data bodies.
  // For plain JSON (customer) requests, multer is a no-op.
  uploadGhanaCard(req, res, async (err) => {
    if (err) {
      console.error("❌ Multer upload error:", err);
      return handleUploadError(err, req, res, () => { });
    }

    // Now req.body is fully parsed (multipart fields + file)
    await handleRegistration(req, res);
  });
});

async function handleRegistration(req, res) {
  try {
    // Check if user exists by Supabase Auth ID first, then by email
    let existingUser = await User.findByAuthId(req.auth.uid);
    if (!existingUser && req.auth.email) {
      existingUser = await User.findByEmail(req.auth.email.toLowerCase());
    }

    const normalized = normalizeRequestBody(req.body);
    const isDriver = normalized.role === "driver";
    const isCustomer = normalized.role === "customer";

    console.log("🔍 DEBUG - Registration Attempt:", {
      role: normalized.role,
      isDriver,
      isCustomer,
      authId: req.auth.uid,
      email: normalized.email,
      name: normalized.name,
      hasFile: !!req.file,
      existingUserId: existingUser?.id,
      existingUserRole: existingUser?.role
    });

    // Validate based on role
    if (isDriver) {
      const validation = driverRegisterSchema.safeParse(normalized);
      if (!validation.success) {
        console.error("❌ Driver validation failed:", JSON.stringify(validation.error.errors, null, 2));
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      // Require Ghana Card image for drivers
      if (!req.file) {
        console.error("❌ Driver registration missing Ghana Card image file");
        return res.status(400).json({
          message: "Ghana Card image is required for driver registration"
        });
      }
    } else if (isCustomer) {
      const validation = customerRegisterSchema.safeParse(normalized);
      if (!validation.success) {
        console.error("❌ Customer validation failed:", JSON.stringify(validation.error.errors, null, 2));
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }
    } else {
      return res.status(400).json({ message: "Invalid role. Must be 'customer' or 'driver'" });
    }

    let user;

    if (existingUser) {
      // User already exists (e.g. from prior registration or DB trigger)
      if (isDriver) {
        // Upgrade/update user to driver role and set pending approval status
        user = await User.findByIdAndUpdate(
          existingUser.id,
          {
            authId: req.auth.uid,
            name: normalized.name || existingUser.name,
            phone: normalized.phone || existingUser.phone,
            role: "driver",
            status: "pending",
            isActive: true,
            address: {
              street: normalized.street || existingUser.address?.street || "",
              city: normalized.city || existingUser.address?.city || "",
              region: normalized.region || existingUser.address?.region || "",
              country: "Ghana"
            }
          }
        );
      } else {
        // Customer update
        user = await User.findByIdAndUpdate(
          existingUser.id,
          {
            authId: req.auth.uid,
            name: normalized.name || existingUser.name,
            phone: normalized.phone || existingUser.phone,
            role: "customer",
            status: "active",
            isActive: true,
            address: {
              street: normalized.street || existingUser.address?.street || "",
              city: normalized.city || existingUser.address?.city || "",
              region: normalized.region || existingUser.address?.region || "",
              country: "Ghana"
            }
          }
        );
      }
    } else {
      // Create brand new user
      user = await User.create({
        authId: req.auth.uid,
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        avatar: normalized.avatar || undefined,
        role: normalized.role,
        status: isDriver ? "pending" : "active",
        isActive: true,
        address: {
          street: normalized.street || "",
          city: normalized.city || "",
          region: normalized.region || "",
          country: "Ghana"
        }
      });
    }

    console.log("✅ User registered/updated:", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    });

    // Create or update driver profile if driver role
    if (isDriver) {
      const driverData = {
        userId: user.id,
        licenseNumber: normalized.licenseNumber,
        vehicleNumber: normalized.vehicleNumber,
        vehicleType: normalized.vehicleType || "Van",
        digitalAddress: normalized.digitalAddress || null,
        status: "pending",
        isAvailable: false
      };

      if (req.file?.filename) {
        driverData.ghanaCardImage = req.file.filename;
      }

      // Check if driver profile exists
      const existingDriver = await Driver.findByUserId(user.id);
      
      let driverDoc;
      if (existingDriver) {
        // Update existing driver
        driverDoc = await Driver.findByIdAndUpdate(existingDriver.id, driverData);
      } else {
        // Create new driver
        driverDoc = await Driver.create(driverData);
      }

      console.log("✅ Driver document upserted:", {
        id: driverDoc.id,
        userId: driverDoc.userId,
        status: driverDoc.status,
        licenseNumber: driverDoc.licenseNumber,
        vehicleNumber: driverDoc.vehicleNumber,
        hasGhanaCard: !!driverDoc.ghanaCardImage
      });
    }

    // Return user object
    const responseUser = {
      _id: user.id, // MongoDB compatibility
      id: user.id,
      authId: user.authId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      address: user.address,
      createdAt: user.createdAt
    };

    res.status(201).json(responseUser);
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Registration failed: " + (error.message || "Internal server error") });
  }
}

router.get("/me", verifySupabaseToken, requireRegisteredUser, (req, res) => {
  if (req.user.isActive === false) {
    return res.status(403).json({ message: "Account has been deactivated" });
  }
  res.json(req.user);
});

export default router;