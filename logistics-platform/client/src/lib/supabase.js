import { createClient } from '@supabase/supabase-js'

const defaultUrl = 'https://ekkeajtpxgwrtcebumhh.supabase.co'
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVra2VhanRweGd3cnRjZWJ1bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNDE1MzEsImV4cCI6MjEwNTYxNzUzMX0.8iCSxjfZwg8kYc26NjDJS40z5bN8v2pO0fSIkN6CSVM'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard against placeholder strings accidentally entered in deployment dashboards (e.g. Vercel)
const isValidKey = (key) => typeof key === 'string' && key.startsWith('ey') && !key.includes(' ') && !key.includes('(')
const isValidUrl = (url) => typeof url === 'string' && url.startsWith('http') && !url.includes(' ')

const supabaseUrl = isValidUrl(envUrl) ? envUrl : defaultUrl;
const supabaseAnonKey = isValidKey(envKey) ? envKey : defaultAnonKey;

if (!isValidKey(envKey) && import.meta.env.DEV) {
  console.info("ℹ️ Using default project Supabase public anon key. For production, set VITE_SUPABASE_ANON_KEY in your deployment environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
