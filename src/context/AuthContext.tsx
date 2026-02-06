import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { supabase } from "../utils/supabaseClient"

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

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | undefined // Initialize as undefined

    const getSession = async () => {
      try {
        // Set timeout to force loading false if supabase hangs
        // Reduced to 2.5s to prevent long "Checking your session..." screens
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn("[auth] Session check timed out - Supabase might be unreachable")
            setLoading(false)
            // Do NOT force setUserId(null) blindly here, as it destroys optimistic state
          }
        }, 2500)

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
        if (mounted) {
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId) // Clear timeout on success or failure
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        setUserId(null)
        setEmail(null)
        setRoles([])
        return
      }

      setUserId(session.user.id)
      setEmail(session.user.email ?? null)
      await fetchRoles(session.user.id)
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchRoles = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id)

      if (error) {
        // Handle missing table gracefully - assign default "user" role
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.warn("[auth] user_roles table missing, using default role")
          setRoles(["user"])
          return
        }
        console.warn("[auth] Failed to load roles:", error.message)
        setRoles(["user"]) // Default to user role on error
        return
      }

      const mapped = (data ?? []).map((row) => row.role as AppRole)
      setRoles(mapped.length ? mapped : ["user"])
    } catch (err) {
      console.warn("[auth] Error fetching roles:", err)
      setRoles(["user"]) // Default to user role on any error
    }
  }

  const signIn = async (authEmail: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }

  const signUp = async (authEmail: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return {}
  }

  const signInWithGoogle = async () => {
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
  }

  const signOut = async () => {
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
  }

  const refreshRoles = async () => {
    if (!userId) return
    await fetchRoles(userId)
  }

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
    [userId, email, roles, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
