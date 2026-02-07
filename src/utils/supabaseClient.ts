import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Whether the Supabase environment variables are properly configured.
 * When false, the app should skip all Supabase calls and run in local-only mode.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let _supabase: SupabaseClient

if (isSupabaseConfigured) {
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch (error) {
    console.error("[supabase] Failed to initialize Supabase client:", error)
    // Create a client with a placeholder URL so imports don't break.
    // isSupabaseConfigured is already false-like in this path since we caught an error.
    _supabase = createClient("https://placeholder.supabase.co", "placeholder", {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    // Override the flag so downstream code knows not to use it
    ;(globalThis as Record<string, unknown>).__supabaseInitFailed = true
  }
} else {
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Running in local-only mode."
  )
  // Create a client with a placeholder so module imports don't crash.
  _supabase = createClient("https://placeholder.supabase.co", "placeholder", {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const supabase = _supabase
