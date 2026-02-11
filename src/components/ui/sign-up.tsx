import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Layers3, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { Button } from "./button";

type SignUpStep = "email" | "password" | "confirm";

interface SignUpProps {
  onSwitchToSignIn: () => void;
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
  );
}

function GradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, hsl(var(--primary) / 0.45), transparent 45%), radial-gradient(circle at 85% 25%, hsl(var(--accent) / 0.3), transparent 42%), radial-gradient(circle at 20% 88%, hsl(var(--secondary) / 0.3), transparent 46%), radial-gradient(circle at 80% 80%, hsl(var(--muted) / 0.28), transparent 44%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/35 to-background/75" />
    </div>
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep] = useState<SignUpStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step === "email") {
        emailRef.current?.focus();
      } else if (step === "password") {
        passwordRef.current?.focus();
      } else {
        confirmRef.current?.focus();
      }
    }, 40);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    setError(null);
  }, [step]);

  const launchConfetti = useCallback(async () => {
    if (shouldReduceMotion || typeof window === "undefined") {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const toHsl = (token: string, fallback: string) => {
      const value = rootStyles.getPropertyValue(token).trim();
      return value ? `hsl(${value})` : fallback;
    };

    try {
      const confettiModule = await import("canvas-confetti");
      confettiModule.default({
        particleCount: 70,
        spread: 65,
        startVelocity: 32,
        scalar: 0.9,
        origin: { y: 0.72 },
        colors: [
          toHsl("--primary", "#2F7D4C"),
          toHsl("--secondary", "#5DAA7F"),
          toHsl("--accent", "#B8791E"),
        ],
      });
    } catch {
      // Confetti is non-blocking enhancement only.
    }
  }, [shouldReduceMotion]);

  const validateEmail = () => {
    const normalized = email.trim();
    if (!EMAIL_REGEX.test(normalized)) {
      setError("Enter a valid email address.");
      return false;
    }
    setError(null);
    return true;
  };

  const validatePassword = () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return false;
    }
    setError(null);
    return true;
  };

  const validateConfirmation = () => {
    if (confirmPassword !== password) {
      setError("Passwords do not match.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setNotice(null);
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
    }
    setIsGoogleLoading(false);
  };

  const handleContinue = () => {
    setNotice(null);
    if (step === "email") {
      if (validateEmail()) setStep("password");
      return;
    }

    if (step === "password") {
      if (validatePassword()) setStep("confirm");
    }
  };

  const handleBack = () => {
    setNotice(null);
    setError(null);
    if (step === "confirm") {
      setStep("password");
      return;
    }
    setStep("email");
  };

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setError(null);

    if (!validateEmail() || !validatePassword() || !validateConfirmation()) {
      return;
    }

    setIsEmailLoading(true);
    const result = await signUp(email.trim(), password);
    setIsEmailLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    await launchConfetti();
    setNotice("Account created. Check your inbox to confirm your email before signing in.");
    setStep("email");
    setPassword("");
    setConfirmPassword("");
  };

  const submitDisabled =
    isEmailLoading ||
    isGoogleLoading ||
    (step === "email" && !email.trim()) ||
    (step === "password" && !password) ||
    (step === "confirm" && !confirmPassword);

  const stepTitle =
    step === "email" ? "Start with your email" : step === "password" ? "Create a password" : "Confirm password";

  const stepDescription =
    step === "email"
      ? "Use an email you can access for account verification."
      : step === "password"
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters for security.`
        : "Confirm your password to create your NutriAI account.";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <GradientBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8">
        <section className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-primary/15 text-primary">
              <Layers3 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold tracking-wide text-primary">NutriAI</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Glass-style onboarding with secure email signup or Google.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-border/70 bg-background/65 text-foreground hover:bg-accent/60"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isEmailLoading}
          >
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            <span className="ml-2">Continue with Google</span>
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border/70" />
            <span>or sign up with email</span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-4" noValidate>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border border-border/80",
                    step === "email" && "bg-primary border-primary"
                  )}
                />
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border border-border/80",
                    step === "password" && "bg-primary border-primary"
                  )}
                />
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border border-border/80",
                    step === "confirm" && "bg-primary border-primary"
                  )}
                />
              </div>

              <h2 className="text-base font-semibold text-foreground">{stepTitle}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{stepDescription}</p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: "easeOut" }}
                  className="mt-4"
                >
                  {step === "email" ? (
                    <div>
                      <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-foreground">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          ref={emailRef}
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-11 w-full rounded-xl border border-input bg-background/75 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === "password" ? (
                    <div>
                      <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-foreground">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          ref={passwordRef}
                          id="signup-password"
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="h-11 w-full rounded-xl border border-input bg-background/75 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Create a secure password"
                          required
                          minLength={MIN_PASSWORD_LENGTH}
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === "confirm" ? (
                    <div>
                      <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-medium text-foreground">
                        Confirm password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          ref={confirmRef}
                          id="signup-confirm"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          className="h-11 w-full rounded-xl border border-input bg-background/75 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Re-enter your password"
                          required
                        />
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {notice ? (
              <p className="flex items-start gap-2 rounded-xl border border-primary/35 bg-primary/10 px-3 py-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{notice}</span>
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              {step !== "email" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-border/70 bg-background/65 px-4"
                  onClick={handleBack}
                  disabled={isEmailLoading || isGoogleLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : null}

              {step !== "confirm" ? (
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-xl"
                  onClick={handleContinue}
                  disabled={submitDisabled}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="h-11 flex-1 rounded-xl" disabled={submitDisabled}>
                  {isEmailLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              className="font-semibold text-primary transition-colors hover:text-primary/80"
              onClick={onSwitchToSignIn}
            >
              Sign in
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
