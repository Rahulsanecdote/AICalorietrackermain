import React, { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { SignUp } from "./ui/sign-up"

export default function AuthScreen() {
  const { signIn, signInWithGoogle } = useAuth()
  const [showSignUp, setShowSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignInSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  if (showSignUp) {
    return <SignUp onSwitchToSignIn={() => setShowSignUp(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
            NA
          </div>
          <h1 className="text-2xl font-semibold text-foreground mt-4">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to access your nutrition dashboard.
          </p>
        </div>

        <form onSubmit={handleSignInSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              setError(null)
              setIsSubmitting(true)
              const result = await signInWithGoogle()
              if (result.error) setError(result.error)
              setIsSubmitting(false)
            }}
            className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2 bg-card border border-input rounded-lg hover:bg-muted transition-colors disabled:opacity-60 text-foreground font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </div>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          New here?{" "}
          <button
            type="button"
            className="text-primary hover:text-primary/80 font-medium"
            onClick={() => setShowSignUp(true)}
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  )
}
