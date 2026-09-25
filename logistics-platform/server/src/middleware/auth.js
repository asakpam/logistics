import { supabase } from "../config/db.js";
import { User } from "../models/User.js";

/**
 * Verify Supabase JWT token
 * Extracts user from Supabase Auth token and attaches to req.auth
 */
export async function verifySupabaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Token verification error:", error?.message);
      return res.status(401).json({ message: "Invalid authorization token" });
    }

    // Attach Supabase user to request
    req.auth = {
      uid: user.id,
      email: user.email,
      role: user.role,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    };

    next();
  } catch (error) {
    console.error("verifySupabaseToken error:", error.message);
    res.status(401).json({ message: "Invalid authorization token" });
  }
}

/**
 * Require user to be registered in our users table
 * Fetches user profile from database and attaches to req.user
 */
export async function requireRegisteredUser(req, res, next) {
  try {
    if (!req.auth?.uid) {
      return res.status(401).json({ message: "Missing authenticated user" });
    }

    // Lookup user by Supabase Auth ID
    const user = await User.findByAuthId(req.auth.uid);

    if (!user) {
      return res.status(401).json({ 
        message: "User is not registered on the platform",
        authId: req.auth.uid
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "User account is inactive or suspended" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("requireRegisteredUser error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
}

/**
 * Require user to have specific role(s)
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Access denied",
        required: roles,
        current: req.user?.role
      });
    }

    next();
  };
}

// Backward compatibility aliases
export const verifyFirebaseToken = verifySupabaseToken;
