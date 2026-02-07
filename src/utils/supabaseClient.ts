import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logs to verify environment variable values at runtime
console.log("[supabase] VITE_SUPABASE_URL:", supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "MISSING")
console.log("[supabase] VITE_SUPABASE_ANON_KEY present:", Boolean(supabaseAnonKey))

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http"))

if (!isSupabaseConfigured) {
  console.warn("[supabase] Supabase is not properly configured. Running in local-only mode.")
}

// Create a mock client for when Supabase is not configured
const createMockClient = (): SupabaseClient => {
  const mockAuth = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    signInWithOAuth: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
    signOut: () => Promise.resolve({ error: null }),
  }
  
  const mockFrom = () => ({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }), order: () => Promise.resolve({ data: [], error: null }) }) }),
    insert: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
    update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: { message: "Supabase not configured" } }) }) }),
    delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: { message: "Supabase not configured" } }) }) }),
    upsert: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
  })

  return {
    auth: mockAuth,
    from: mockFrom,
  } as unknown as SupabaseClient
}

// Create the actual or mock client based on configuration
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createMockClient()
