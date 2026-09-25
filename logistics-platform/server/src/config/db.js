import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "❌ Missing Supabase credentials!\n" +
    "   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.\n" +
    "   See SUPABASE_SETUP.md for instructions."
  );
}

// Create Supabase client with service role key (bypasses RLS for server operations)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Test Supabase connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function connectDatabase() {
  try {
    // Test connection by querying the users table
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("❌ Supabase connection error:", error.message);
      throw error;
    }

    console.log("✅ Supabase connected successfully to:", supabaseUrl);
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to Supabase:", error.message);
    console.error("   Make sure you've:");
    console.error("   1. Created a Supabase project");
    console.error("   2. Run supabase-schema.sql in SQL Editor");
    console.error("   3. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env");
    throw error;
  }
}
