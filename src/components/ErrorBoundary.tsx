"use client"

/**
 * Enhanced Error Boundary with 3-layer containment support
 * Provides root, feature, and async boundary capabilities with resetKeys support
 */

import React, { Component, type ErrorInfo, type ReactNode, type ReactElement } from "react"
import { AlertTriangle, RefreshCw, Download, Copy, Check, WifiOff, ShieldAlert } from "lucide-react"
import { generateErrorId, getErrorMessage, logError, toAppError } from "../utils/errors"
import { captureException, addBreadcrumb, setContext } from "../utils/monitoring"
import { notifyError, notifySuccess } from "../utils/notifications"

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
export class FeatureErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private previousResetKeys: (string | number)[] = []

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      resetKey: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys = [] } = this.props
    const { resetKeys: prevResetKeys = [] } = prevProps

    // Check if resetKeys have changed
    const keysChanged =
      resetKeys.some((key) => !prevResetKeys.includes(key)) || prevResetKeys.some((key) => !resetKeys.includes(key))

    if (keysChanged && this.state.hasError) {
      // Reset the error boundary when resetKeys change
      this.handleReset()
    }

    this.previousResetKeys = resetKeys
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorInfoString = errorInfo.componentStack ?? "No component stack available"
    this.setState({ errorInfo: errorInfoString })

    const appError = toAppError(error, { featureName: this.props.featureName })
    logError(appError, errorInfoString)

    setContext("errorBoundary", {
      featureName: this.props.featureName,
      errorId: this.state.errorId,
      componentStack: errorInfoString,
    })
    captureException(error)

    if (this.props.onError) {
      this.props.onError(error, errorInfoString, this.state.errorId ?? generateErrorId())
    }

    console.error(`[${this.props.featureName ?? "Feature"}] Error Boundary caught an error:`, error, errorInfo)
  }

  handleReset = (): void => {
    const previousState = { ...this.state }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      resetKey: Date.now(),
    })

    if (this.props.onReset) {
      this.props.onReset(previousState)
    }
  }

  handleReport = (): void => {
    const { error, errorInfo, errorId } = this.state
    const report = {
      id: errorId,
      message: error?.message ?? "Unknown",
      stack: error?.stack ?? "No stack",
      componentStack: errorInfo ?? "No component stack",
      feature: this.props.featureName ?? "Unknown",
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    navigator.clipboard
      .writeText(JSON.stringify(report, null, 2))
      .then(() => {
        notifySuccess("Error report copied to clipboard. Please share this with support.")
      })
      .catch((copyError) => {
        console.error("Failed to copy error report:", copyError)
        notifyError("Failed to copy error report. Please try again.")
      })
  }

  render(): ReactNode {
    const { hasError, error } = this.state

    if (hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback({ error: error!, reset: this.handleReset })
        }
        return this.props.fallback
      }

      return (
        <FeatureErrorFallback
          featureName={this.props.featureName}
          error={error}
          onReset={this.handleReset}
          onReport={this.handleReport}
          showDetails={this.props.showDetails}
          onManualMode={this.props.onManualMode}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Feature Error Fallback Component
// ============================================================================

interface FeatureErrorFallbackProps {
  featureName?: string
  error: Error | null
  onReset: () => void
  onReport: () => void
  showDetails?: boolean
  onManualMode?: () => void
}

function FeatureErrorFallback({
  featureName,
  error,
  onReset,
  onReport,
  showDetails = false,
  onManualMode,
}: FeatureErrorFallbackProps): ReactElement {
  const userMessage = getErrorMessage(error, "An error occurred")

  return (
    <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-amber-800 mb-1">
            {featureName ? `${featureName} unavailable` : "Something went wrong"}
          </h3>
          <p className="text-sm text-amber-700 mb-4">{userMessage}</p>

          {showDetails && error && (
            <details className="mb-4">
              <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-amber-600 font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              onClick={onReport}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Report
            </button>
            {onManualMode && (
              <button
                onClick={onManualMode}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <WifiOff className="w-3.5 h-3.5" />
                Manual Mode
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Async Boundary Component with resetKeys
// ============================================================================

export class AsyncBoundary extends Component<AsyncBoundaryProps, AsyncErrorState> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null
  private previousResetKeys: (string | number)[] = []

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

    this.previousResetKeys = resetKeys
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
    <div className="border border-red-200 bg-red-50 rounded-lg p-4 my-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          {userMessage.includes("connect") ? (
            <WifiOff className="w-4 h-4 text-red-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">
            {featureName ? `${featureName} failed` : "Operation failed"}
          </h4>
          <p className="text-sm text-red-700 mt-1">{userMessage}</p>

          {canRetry && (
            <p className="text-xs text-red-500 mt-2">
              Retrying in {countdown}s... (Attempt {retryCount + 1})
            </p>
          )}

          {!canRetry && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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
  errorInfo,
  onReset,
  onDownloadBackup,
  onCopyError,
  copied,
}: RootFallbackProps): ReactElement {
  const userMessage = getErrorMessage(error, "An unexpected error occurred")
  const isChunkError =
    error?.message?.toLowerCase().includes("chunk") || error?.message?.toLowerCase().includes("module")

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-red-50 px-6 py-8 text-center border-b border-red-100">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {isChunkError ? "Update Available" : "Something went wrong"}
          </h1>
          <p className="text-sm text-gray-600">
            {isChunkError
              ? "A new version of the app is available. Please reload to get the latest features and bug fixes."
              : "The application encountered an unexpected error. Your data is safe."}
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="text-xs text-gray-500 font-mono break-all">{error?.message ?? "Unknown error type"}</div>
          {error?.stack && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Show stack trace</summary>
              <pre className="mt-2 text-xs text-gray-400 font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="px-6 py-4 space-y-3">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            {isChunkError ? "Update & Reload" : "Reload Application"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDownloadBackup}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download Backup
            </button>
            <button
              onClick={onCopyError}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-center text-gray-500">
            If this problem persists, please contact support with the error details.
          </p>
        </div>
      </div>
    </div>
  )
}

export class RootErrorBoundary extends Component<ErrorBoundaryProps, RootErrorBoundaryState> {
  private previousResetKeys: (string | number)[] = []

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

    this.previousResetKeys = resetKeys
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
    } catch (e) {
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
      className={`flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 ${className}`}
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
          className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
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
