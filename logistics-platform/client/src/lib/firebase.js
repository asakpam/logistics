// ============================================================================
// DEPRECATED: Firebase has been replaced with Supabase Auth
// ============================================================================
// This file is kept for backward compatibility only.
// All new code should import from './supabase.js' instead.
// 
// Migration: Firebase Auth → Supabase Auth (September 2026)
// ============================================================================

console.warn(
  "[Logistics] Firebase is deprecated and has been replaced with Supabase Auth.\n" +
  "Please update imports to use './supabase.js' instead."
);

// Export stubs to prevent import errors in legacy code
export const FIREBASE_CONFIGURED = false;
export const auth = null;
export const googleProvider = null;
export default null;
