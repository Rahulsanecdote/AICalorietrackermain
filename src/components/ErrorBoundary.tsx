"use client"

/**
 * Enhanced Error Boundary with 3-layer containment support
 * Provides root, feature, and async boundary capabilities with resetKeys support
 */

import React, { Component, type ErrorInfo, type ReactNode, type ReactElement } from "react"
import { AlertTriangle, RefreshCw, Download, Copy, Check, WifiOff, ShieldAlert } from "lucide-react"
import { generateErrorId, getErrorMessage, logError, toAppError } from "../utils/errors"
import { captureException, addBreadcrumb, setContext } from "../utils/monitoring"

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  errorId: string | null
  resetKey: string | number | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode)
  onError?: (error: Error, errorInfo: string, errorId: string) => void
  onReset?: (previousState: ErrorBoundaryState) => void
  level?: "root" | "feature" | "async"
  featureName?: string
  showDetails?: boolean
  resetKeys?: (string | number)[]
  onManualMode?: () => void
}

interface AsyncErrorState {
  isError: boolean
  error: Error | null
  retryCount: number
  resetKey: string | number | null
}

interface AsyncBoundaryProps {
  children: ReactNode | ((props: { isLoading: boolean }) => ReactNode)
  fallback?: ReactNode
  onError?: (error: Error) => void
  onRetry?: () => void
  maxRetries?: number
  retryDelay?: number
  featureName?: string
  resetKeys?: (string | number)[]
}

// ============================================================================
// Feature Error Boundary with resetKeys
// ============================================================================

/**
 * Feature-level error boundary with contextual fallback UI and resetKeys support
 * Allows individual features to fail gracefully without affecting the rest of the app
 */
interface FeatureProps {
  children: ReactNode
  feature: string
}

interface FeatureState {
  hasError: boolean
  error: Error | null
}

export class FeatureErrorBoundary extends Component<FeatureProps, FeatureState> {
  constructor(props: FeatureProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): FeatureState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[FeatureErrorBoundary] ${this.props.feature}`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/10">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-700 dark:text-red-300">
            The {this.props.feature} feature encountered an error. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}


// ============================================================================
// Async Boundary Component with resetKeys
// ============================================================================

export class AsyncBoundary extends Component<AsyncBoundaryProps, AsyncErrorState> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(props: AsyncBoundaryProps) {
    super(props)
    this.state = {
      isError: false,
      error: null,
      retryCount: 0,
      resetKey: null,
    }
  }

  componentDidUpdate(prevProps: AsyncBoundaryProps): void {
    const { resetKeys = [] } = this.props
    const { resetKeys: prevResetKeys = [] } = prevProps

    const keysChanged =
      resetKeys.some((key) => !prevResetKeys.includes(key)) || prevResetKeys.some((key) => !resetKeys.includes(key))

    if (keysChanged && this.state.isError) {
      this.setState({
        isError: false,
        error: null,
        retryCount: 0,
        resetKey: Date.now(),
      })
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorState> {
    return { isError: true, error }
  }

  componentDidCatch(error: Error): void {
    const appError = toAppError(error)
    logError(appError)

    captureException(error)

    if (this.props.onError) {
      this.props.onError(error)
    }

    if (this.props.onRetry) {
      this.props.onRetry()
    }

    console.error("AsyncBoundary caught an error:", error)
  }

  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  handleRetry = (): void => {
    this.setState((prev) => ({
      isError: false,
      error: null,
      retryCount: prev.retryCount + 1,
      resetKey: Date.now(),
    }))
  }

  render(): ReactNode {
    const { isError, error, retryCount } = this.state
    const { children, fallback, maxRetries = 3, retryDelay = 1000, featureName } = this.props

    if (isError && error) {
      if (fallback) {
        return fallback
      }

      return (
        <AsyncErrorFallback
          error={error}
          featureName={featureName}
          onRetry={this.handleRetry}
          canRetry={retryCount < maxRetries}
          retryCount={retryCount}
          retryDelay={retryDelay}
        />
      )
    }

    return typeof children === "function" ? children({ isLoading: false }) : children
  }
}

// ============================================================================
// Async Error Fallback Component
// ============================================================================

interface AsyncErrorFallbackProps {
  error: Error
  featureName?: string
  onRetry: () => void
  canRetry: boolean
  retryCount: number
  retryDelay: number
}

function AsyncErrorFallback({
  error,
  featureName,
  onRetry,
  canRetry,
  retryCount,
  retryDelay,
}: AsyncErrorFallbackProps): ReactElement {
  const [countdown, setCountdown] = React.useState(retryDelay / 1000)
  const userMessage = getErrorMessage(error)

  React.useEffect(() => {
    if (!canRetry) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onRetry()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [canRetry, onRetry, retryDelay])

  return (
    <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-4 my-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
          {userMessage.includes("connect") ? (
            <WifiOff className="w-4 h-4 text-destructive" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-medium text-destructive">
            {featureName ? `${featureName} failed` : "Operation failed"}
          </h4>
          <p className="text-sm text-destructive/90 mt-1">{userMessage}</p>

          {canRetry && (
            <p className="text-xs text-destructive/80 mt-2">
              Retrying in {countdown}s... (Attempt {retryCount + 1})
            </p>
          )}

          {!canRetry && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Root Error Boundary with resetKeys
// ============================================================================

interface RootErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  errorId: string | null
  copied: boolean
  resetKey: string | number | null
}

interface RootFallbackProps {
  error: Error | null
  errorInfo: string | null
  onReset: () => void
  onDownloadBackup: () => void
  onCopyError: () => void
  copied: boolean
}

function RootErrorFallbackUI({
  error,

  onReset,
  onDownloadBackup,
  onCopyError,
  copied,
}: RootFallbackProps): ReactElement {
  const isChunkError =
    error?.message?.toLowerCase().includes("chunk") || error?.message?.toLowerCase().includes("module")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
        <div className="bg-destructive/10 px-6 py-8 text-center border-b border-destructive/20">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {isChunkError ? "Update Available" : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isChunkError
              ? "A new version of the app is available. Please reload to get the latest features and bug fixes."
              : "The application encountered an unexpected error. Your data is safe."}
          </p>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <div className="text-xs text-muted-foreground font-mono break-all">{error?.message ?? "Unknown error type"}</div>
          {error?.stack && (
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Show stack trace</summary>
              <pre className="mt-2 text-xs text-muted-foreground font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="px-6 py-4 space-y-3">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            {isChunkError ? "Update & Reload" : "Reload Application"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDownloadBackup}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download Backup
            </button>
            <button
              onClick={onCopyError}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Error
                </>
              )}
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-muted/50 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            If this problem persists, please contact support with the error details.
          </p>
        </div>
      </div>
    </div>
  )
}

export class RootErrorBoundary extends Component<ErrorBoundaryProps, RootErrorBoundaryState> {

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
      resetKey: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<RootErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys = [] } = this.props
    const { resetKeys: prevResetKeys = [] } = prevProps

    const keysChanged =
      resetKeys.some((key) => !prevResetKeys.includes(key)) || prevResetKeys.some((key) => !resetKeys.includes(key))

    if (keysChanged && this.state.hasError) {
      this.handleReset()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorInfoString = errorInfo.componentStack ?? "No component stack available"
    this.setState({ errorInfo: errorInfoString })

    const appError = toAppError(error, {
      featureName: this.props.featureName,
      componentStack: errorInfoString,
    })
    logError(appError, errorInfoString)

    setContext("rootErrorBoundary", {
      featureName: this.props.featureName,
      errorId: this.state.errorId,
      componentStack: errorInfoString,
      url: window.location.href,
      userAgent: navigator.userAgent,
    })
    captureException(error)

    if (this.props.onError) {
      this.props.onError(error, errorInfoString, this.state.errorId ?? generateErrorId())
    }

    console.error("Root Error Boundary caught an error:", error, errorInfo)

    this.reportError(error, errorInfoString)
  }

  reportError = async (error: Error, errorInfo: string): Promise<void> => {
    try {
      const errorReport = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        featureName: this.props.featureName,
      }

      console.log("Error report prepared:", errorReport)
      addBreadcrumb("Error report prepared", "error", "info", { errorId: this.state.errorId })
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError)
    }
  }

  handleReset = (): void => {
    const previousState = { ...this.state }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
      resetKey: Date.now(),
    })

    if (this.props.onReset) {
      this.props.onReset(previousState)
    }

    // Perform the actual reset/reload
    window.location.reload()
  }

  handleDownloadBackup = (): void => {
    const backupData: Record<string, unknown> = {}

    try {
      const storageData: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          storageData[key] = localStorage.getItem(key) ?? ""
        }
      }
      backupData.localStorage = storageData
    } catch {
      // Ignore storage errors
      backupData.localStorage = { error: "Unable to read localStorage" }
    }

    backupData.backupTimestamp = new Date().toISOString()
    backupData.errorContext = {
      message: this.state.error?.message ?? "Unknown",
      occurredAt: new Date().toISOString(),
      errorId: this.state.errorId,
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `calorie-tracker-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  handleCopyError = (): void => {
    const { error, errorInfo, errorId } = this.state
    const errorReport = `Error ID: ${errorId}\nError: ${error?.message ?? "Unknown error"}\n\nStack: ${error?.stack ?? "No stack trace"}\n\nComponent: ${errorInfo ?? "Unknown component"}`
    navigator.clipboard.writeText(errorReport)
    this.setState({ copied: true })
    setTimeout(() => this.setState({ copied: false }), 2000)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback({
            error: this.state.error!,
            reset: this.handleReset,
          })
        }
        return this.props.fallback
      }

      return (
        <RootErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onDownloadBackup={this.handleDownloadBackup}
          onCopyError={this.handleCopyError}
          copied={this.state.copied}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Inline Error Message Component
// ============================================================================

interface ErrorMessageProps {
  error: string | null
  onDismiss?: () => void
  className?: string
}

export function ErrorMessage({ error, onDismiss, className = "" }: ErrorMessageProps): ReactElement | null {
  if (!error) return null

  return (
    <div
      className={`flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive ${className}`}
      role="alert"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="flex-1">{error}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-destructive/20 rounded"
          aria-label="Dismiss error"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Loading Spinner Component
// ============================================================================

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps): ReactElement {
  const sizeClasses = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// ============================================================================
// Success Message Component
// ============================================================================

interface SuccessMessageProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export function SuccessMessage({ message, onDismiss, className = "" }: SuccessMessageProps): ReactElement {
  return (
    <div
      className={`flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 ${className}`}
      role="alert"
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

const ErrorBoundary = FeatureErrorBoundary // Declare the ErrorBoundary variable

export default ErrorBoundary
