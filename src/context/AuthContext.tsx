import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react"
import { supabase, isSupabaseConfigured } from "../utils/supabaseClient"

export type AppRole = "user" | "admin"

interface AuthState {
  userId: string | null
  email: string | null
  roles: AppRole[]
  isAdmin: boolean
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshRoles: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id)

      if (error) throw error

      setRoles(data.map((r) => r.role))
    } catch (err) {
      console.error("Error fetching roles:", err)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let slowSessionTimer: ReturnType<typeof setTimeout> | undefined
    let timeoutWarningTimer: ReturnType<typeof setTimeout> | undefined
    let sessionResolved = false

    const getSession = async () => {
      // If Supabase is not configured, skip auth entirely and run in local-only mode
      if (!isSupabaseConfigured) {
        console.log("[auth] Supabase not configured - running in local-only mode")
        if (mounted) {
          setUserId(null)
          setEmail(null)
          setRoles([])
          setLoading(false)
        }
        return
      }

      try {
        // Keep startup responsive: if session is slow, continue without blocking UI.
        slowSessionTimer = setTimeout(() => {
          if (mounted && !sessionResolved) {
            console.info("[auth] Session check is slow; continuing startup while auth resolves")
            setLoading(false)
          }
        }, 2500)

        // Only treat as unreachable if auth is still unresolved much later.
        timeoutWarningTimer = setTimeout(() => {
          if (mounted && !sessionResolved) {
            console.warn("[auth] Session check timed out - Supabase might be unreachable")
          }
        }, 10000)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error || !session?.user) {
          setUserId(null)
          setEmail(null)
          setRoles([])
        } else {
          setUserId(session.user.id)
          setEmail(session.user.email ?? null)
          await fetchRoles(session.user.id)
        }
      } catch (err) {
        console.error("[auth] Error loading session:", err)
        if (mounted) {
          setUserId(null)
          setEmail(null)
          setRoles([])
        }
      } finally {
        sessionResolved = true
        if (mounted) {
          setLoading(false)
          if (slowSessionTimer) clearTimeout(slowSessionTimer)
          if (timeoutWarningTimer) clearTimeout(timeoutWarningTimer)
        }
      }
    }

    getSession()

    // Only subscribe to auth changes if Supabase is configured
    if (!isSupabaseConfigured) {
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        setUserId(null)
        setEmail(null)
        setRoles([])
        setLoading(false)
        return
      }

      setUserId(session.user.id)
      setEmail(session.user.email ?? null)
      await fetchRoles(session.user.id)
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      if (slowSessionTimer) clearTimeout(slowSessionTimer)
      if (timeoutWarningTimer) clearTimeout(timeoutWarningTimer)
      subscription.unsubscribe()
    }
  }, [fetchRoles])

  const signIn = useCallback(async (authEmail: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Authentication is not configured. Running in local-only mode." }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }, [])

  const signUp = useCallback(async (authEmail: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Authentication is not configured. Running in local-only mode." }
    }
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { error: "Authentication is not configured. Running in local-only mode." }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }, [])

  const signOut = useCallback(async () => {
    try {
      // 1. Explicitly clear local state first for immediate UI feedback
      setUserId(null)
      setEmail(null)
      setRoles([])

      // 2. Call Supabase signOut
      await supabase.auth.signOut()

      // 3. Force reload/redirect to ensure clean state
      // Using window.location to properly clear memory/cache
      window.location.href = '/'
    } catch (error) {
      console.error("Error signing out:", error)
      // Force disconnect anyway
      setUserId(null)
      window.location.href = '/'
    }
  }, [])

  const refreshRoles = useCallback(async () => {
    if (!userId) return
    await fetchRoles(userId)
  }, [userId, fetchRoles])

  const value = useMemo(
    () => ({
      userId,
      email,
      roles,
      isAdmin: roles.includes("admin"),
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      refreshRoles,
    }),
    [userId, email, roles, loading, signIn, signUp, signInWithGoogle, signOut, refreshRoles],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
