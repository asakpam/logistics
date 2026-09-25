import multer from "multer";
import path from "path";
import crypto from "crypto";
import { supabase } from "../config/db.js";

// Configuration: Choose storage backend
const USE_SUPABASE_STORAGE = !!process.env.SUPABASE_URL; // Auto-detect based on env

// ============================================================================
// SUPABASE STORAGE APPROACH (Recommended for production)
// ============================================================================

/**
 * Upload Ghana Card to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} userId - User UUID
 * @param {string} originalName - Original filename
 * @returns {Promise<{filename: string, publicUrl: string}>}
 */
export async function uploadToSupabase(fileBuffer, userId, originalName) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(6).toString("hex");
  const ext = path.extname(originalName);
  
  // Path: userId/timestamp_random.ext
  const filePath = `${userId}/${timestamp}_${randomBytes}${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("ghana-cards")
    .upload(filePath, fileBuffer, {
      contentType: getContentType(ext),
      cacheControl: "3600",
      upsert: false // Don't overwrite existing files
    });

  if (error) {
    console.error("Supabase storage upload error:", error);
    throw new Error(`File upload failed: ${error.message}`);
  }

  // Get public URL (will require authentication due to RLS)
  const { data: { publicUrl } } = supabase.storage
    .from("ghana-cards")
    .getPublicUrl(filePath);

  return {
    filename: filePath,
    publicUrl: publicUrl,
    storageBackend: "supabase"
  };
}

/**
 * Get signed URL for private Ghana Card image
 * @param {string} filePath - File path in storage
 * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from("ghana-cards")
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error("Error creating signed URL:", error);
    throw error;
  }

  return data.signedUrl;
}

/**
 * Delete Ghana Card from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<boolean>}
 */
export async function deleteFromSupabase(filePath) {
  const { error } = await supabase.storage
    .from("ghana-cards")
    .remove([filePath]);

  if (error) {
    console.error("Error deleting file from Supabase:", error);
    return false;
  }

  return true;
}

// ============================================================================
// LOCAL STORAGE APPROACH (Fallback for development)
// ============================================================================

// Ghana Card image storage configuration
const ghanaCardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/ghana-cards/");
  },
  filename: (req, file, cb) => {
    // Generate secure filename: userId_timestamp_random.ext
    const userId = req.user?.id || req.auth?.uid || "unknown";
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(6).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}_${randomBytes}${ext}`);
  }
});

// ============================================================================
// MULTER CONFIGURATION (Works with both backends)
// ============================================================================

// File filter for image files
const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png"];
  const allowedExts = [".jpg", ".jpeg", ".png"];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, and PNG images are allowed"), false);
  }
};

// Choose storage based on configuration
const storageConfig = USE_SUPABASE_STORAGE
  ? multer.memoryStorage() // Store in memory for Supabase upload
  : ghanaCardStorage; // Store to disk for local

// Ghana Card upload middleware
const upload = multer({
  storage: storageConfig,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file
  }
});

/**
 * Upload Ghana Card middleware with Supabase support
 * If Supabase is configured, uploads to Supabase Storage
 * Otherwise falls back to local disk storage
 */
export function uploadGhanaCard(req, res, next) {
  upload.single("ghanaCard")(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    // If no file uploaded, continue
    if (!req.file) {
      return next();
    }

    // If using Supabase, upload the file now
    if (USE_SUPABASE_STORAGE) {
      try {
        const userId = req.user?.id || req.auth?.uid || "unknown";
        const uploadResult = await uploadToSupabase(
          req.file.buffer,
          userId,
          req.file.originalname
        );

        // Replace req.file with Supabase info
        req.file.filename = uploadResult.filename;
        req.file.publicUrl = uploadResult.publicUrl;
        req.file.storageBackend = "supabase";

        console.log("✅ File uploaded to Supabase:", uploadResult.filename);
        next();
      } catch (uploadError) {
        console.error("❌ Supabase upload failed:", uploadError);
        return res.status(500).json({
          message: "Failed to upload Ghana Card image",
          error: uploadError.message
        });
      }
    } else {
      // Local storage - file already saved by multer
      req.file.storageBackend = "local";
      console.log("✅ File uploaded locally:", req.file.filename);
      next();
    }
  });
}

// Error handler for multer errors
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Ghana Card image must be smaller than 5MB" });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Only one Ghana Card image allowed" });
    }
    return res.status(400).json({ message: "File upload error: " + err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get content type from file extension
 * @param {string} ext - File extension (with dot)
 * @returns {string} MIME type
 */
function getContentType(ext) {
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png"
  };
  return types[ext.toLowerCase()] || "application/octet-stream";
}

/**
 * Check if file exists in Supabase Storage
 * @param {string} filePath - File path
 * @returns {Promise<boolean>}
 */
export async function fileExistsInSupabase(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from("ghana-cards")
      .list(path.dirname(filePath), {
        search: path.basename(filePath)
      });

    return !error && data && data.length > 0;
  } catch {
    return false;
  }
}
