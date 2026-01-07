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

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error || !data.session?.user) {
        setUserId(null)
        setEmail(null)
        setRoles([])
        setLoading(false)
        return
      }

      setUserId(data.session.user.id)
      setEmail(data.session.user.email ?? null)
      await fetchRoles(data.session.user.id)
      if (mounted) setLoading(false)
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchRoles = async (id: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", id)

    if (error) {
      console.warn("[auth] Failed to load roles:", error.message)
      setRoles([])
      return
    }

    const mapped = (data ?? []).map((row) => row.role as AppRole)
    setRoles(mapped.length ? mapped : ["user"])
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

  const signOut = async () => {
    await supabase.auth.signOut()
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
