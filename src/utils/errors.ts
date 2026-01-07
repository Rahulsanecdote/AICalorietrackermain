/**
 * Centralized Error Types and Utilities
 * Provides a standardized error handling framework for the entire application
 */

import { captureException, addBreadcrumb, setContext } from "./monitoring"

// ============================================================================
// Error Codes and Types
// ============================================================================

export const ERROR_CODES = {
  // Network errors
  NETWORK_OFFLINE: "NETWORK_OFFLINE",
  NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",

  // API errors
  API_UNAUTHORIZED: "API_UNAUTHORIZED",
  API_FORBIDDEN: "API_FORBIDDEN",
  API_RATE_LIMITED: "API_RATE_LIMITED",
  API_SERVER_ERROR: "API_SERVER_ERROR",
  API_SERVICE_UNAVAILABLE: "API_SERVICE_UNAVAILABLE",
  API_RESPONSE_INVALID: "API_RESPONSE_INVALID",
  API_QUOTA_EXCEEDED: "API_QUOTA_EXCEEDED",

  // Validation errors
  VALIDATION_INPUT_EMPTY: "VALIDATION_INPUT_EMPTY",
  VALIDATION_API_KEY_INVALID: "VALIDATION_API_KEY_INVALID",
  VALIDATION_API_KEY_MISSING: "VALIDATION_API_KEY_MISSING",

  // Parse errors
  PARSE_JSON_ERROR: "PARSE_JSON_ERROR",
  PARSE_RESPONSE_ERROR: "PARSE_RESPONSE_ERROR",

  // Chunk/Module errors
  CHUNK_LOAD_FAILED: "CHUNK_LOAD_FAILED",
  MODULE_NOT_FOUND: "MODULE_NOT_FOUND",

  // Storage errors
  STORAGE_CORRUPTED: "STORAGE_CORRUPTED",
  STORAGE_FULL: "STORAGE_FULL",
  STORAGE_QUOTA_EXCEEDED: "STORAGE_QUOTA_EXCEEDED",

  // Feature-specific errors
  MEAL_PLAN_GENERATION_FAILED: "MEAL_PLAN_GENERATION_FAILED",
  FOOD_ANALYSIS_FAILED: "FOOD_ANALYSIS_FAILED",
  INSIGHTS_GENERATION_FAILED: "INSIGHTS_GENERATION_FAILED",

  // Unknown/Generic
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// ============================================================================
// AppError Interface
// ============================================================================

export interface AppError {
  code: ErrorCode
  userMessage: string
  retryable: boolean
  cause?: Error
  context?: Record<string, unknown>
  timestamp: string
  errorId?: string
}

// ============================================================================
// Operation Status Interface (State Machine)
// ============================================================================

export type OperationStatus = "idle" | "loading" | "success" | "error" | "degraded"

export interface OperationState<T = unknown> {
  status: OperationStatus
  data: T | null
  error: AppError | null
  lastUpdated?: string
}

// ============================================================================
// Error Classification Functions
// ============================================================================

/**
 * Classify a network error into an AppError
 */
export function classifyNetworkError(error: Error, context?: Record<string, unknown>): AppError {
  const message = error.message.toLowerCase()

  if (message.includes("offline") || message.includes("network") || message.includes("fetch")) {
    return createAppError(
      ERROR_CODES.NETWORK_OFFLINE,
      "You appear to be offline. Please check your internet connection.",
      true,
      error,
      context,
    )
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return createAppError(ERROR_CODES.NETWORK_TIMEOUT, "The request timed out. Please try again.", true, error, context)
  }

  return createAppError(ERROR_CODES.NETWORK_ERROR, "A network error occurred. Please try again.", true, error, context)
}

/**
 * Classify an API error into an AppError
 */
export function classifyApiError(
  status: number,
  errorData?: Record<string, unknown>,
  context?: Record<string, unknown>,
): AppError {
  const nestedError = errorData?.error
  const nestedMessage =
    typeof nestedError === "object" && nestedError !== null && "message" in nestedError
      ? String((nestedError as { message?: unknown }).message ?? "")
      : ""
  const topMessage = typeof errorData?.message === "string" ? errorData.message : ""
  const errorMessage = nestedMessage || topMessage || ""

  switch (status) {
    case 401:
      return createAppError(
        ERROR_CODES.API_UNAUTHORIZED,
        "AI service authorization failed. Please contact your administrator.",
        false,
        undefined,
        { ...context, status, errorData },
      )

    case 403:
      return createAppError(
        ERROR_CODES.API_FORBIDDEN,
        "You do not have permission to perform this action.",
        false,
        undefined,
        { ...context, status, errorData },
      )

    case 429:
      return createAppError(
        ERROR_CODES.API_RATE_LIMITED,
        "Too many requests. Please wait a moment before trying again.",
        true,
        undefined,
        { ...context, status, errorData },
      )

    case 500:
      return createAppError(
        ERROR_CODES.API_SERVER_ERROR,
        "A server error occurred. Please try again later.",
        true,
        undefined,
        { ...context, status, errorData },
      )

    case 503:
      return createAppError(
        ERROR_CODES.API_SERVICE_UNAVAILABLE,
        "The service is temporarily unavailable. Please try again later.",
        true,
        undefined,
        { ...context, status, errorData },
      )

    default:
      if (errorMessage.includes("rate") || errorMessage.includes("limit")) {
        return createAppError(
          ERROR_CODES.API_RATE_LIMITED,
          "Too many requests. Please wait a moment before trying again.",
          true,
          undefined,
          { ...context, status, errorData },
        )
      }

      return createAppError(
        ERROR_CODES.API_RESPONSE_INVALID,
        errorMessage || "The API returned an unexpected response.",
        true,
        undefined,
        { ...context, status, errorData },
      )
  }
}

/**
 * Classify a parse error into an AppError
 */
export function classifyParseError(error: Error, context?: Record<string, unknown>): AppError {
  return createAppError(
    ERROR_CODES.PARSE_JSON_ERROR,
    "Unable to process the response. Please try again.",
    true,
    error,
    context,
  )
}

/**
 * Classify a chunk loading error into an AppError
 */
export function classifyChunkError(error: Error, context?: Record<string, unknown>): AppError {
  const message = error.message.toLowerCase()

  if (message.includes("loading chunk") || message.includes("failed to fetch dynamically imported module")) {
    return createAppError(
      ERROR_CODES.CHUNK_LOAD_FAILED,
      "A new version of the app is available. Please reload to update.",
      false,
      error,
      context,
    )
  }

  return createAppError(
    ERROR_CODES.MODULE_NOT_FOUND,
    "Unable to load a required feature. Please try reloading the app.",
    false,
    error,
    context,
  )
}

/**
 * Classify a validation error into an AppError
 */
export function classifyValidationError(
  code: string,
  message: string,
  retryable = false,
  context?: Record<string, unknown>,
): AppError {
  const errorCodeMap: Record<string, ErrorCode> = {
    empty_input: ERROR_CODES.VALIDATION_INPUT_EMPTY,
    invalid_api_key: ERROR_CODES.VALIDATION_API_KEY_INVALID,
    missing_api_key: ERROR_CODES.VALIDATION_API_KEY_MISSING,
  }

  return createAppError(errorCodeMap[code] || ERROR_CODES.UNKNOWN_ERROR, message, retryable, undefined, context)
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a standardized AppError
 */
export function createAppError(
  code: ErrorCode,
  userMessage: string,
  retryable: boolean,
  cause?: Error,
  context?: Record<string, unknown>,
): AppError {
  return {
    code,
    userMessage,
    retryable,
    cause,
    context,
    timestamp: new Date().toISOString(),
    errorId: generateErrorId(),
  }
}

/**
 * Generate a unique error ID for tracking
 */
export function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Convert any error to an AppError
 */
export function toAppError(error: unknown, context?: Record<string, unknown>): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase()

    if (message.includes("fetch") || message.includes("network") || message.includes("offline")) {
      return classifyNetworkError(error, context)
    }

    if (message.includes("json") || message.includes("parse")) {
      return classifyParseError(error, context)
    }

    if (message.includes("chunk") || message.includes("module") || message.includes("import")) {
      return classifyChunkError(error, context)
    }

    return createAppError(
      ERROR_CODES.UNKNOWN_ERROR,
      error.message || "An unexpected error occurred",
      true,
      error,
      context,
    )
  }

  // Handle non-Error objects
  const errorObj = error as Record<string, unknown>
  return createAppError(
    ERROR_CODES.UNKNOWN_ERROR,
    String(errorObj?.message || errorObj?.error || "Unknown error"),
    true,
    undefined,
    context,
  )
}

/**
 * Get a user-friendly message for any error input
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error === null || error === undefined) {
    return fallback
  }

  return toAppError(error).userMessage || fallback
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an object is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  if (!error || typeof error !== "object") {
    return false
  }

  const err = error as Record<string, unknown>
  return (
    typeof err.code === "string" &&
    typeof err.userMessage === "string" &&
    typeof err.retryable === "boolean" &&
    typeof err.timestamp === "string"
  )
}

/**
 * Check if an error is retryable based on its code
 */
export function isRetryableError(error: AppError): boolean {
  const nonRetryableCodes: ErrorCode[] = [
    ERROR_CODES.API_UNAUTHORIZED,
    ERROR_CODES.API_FORBIDDEN,
    ERROR_CODES.VALIDATION_API_KEY_INVALID,
    ERROR_CODES.VALIDATION_API_KEY_MISSING,
    ERROR_CODES.CHUNK_LOAD_FAILED,
    ERROR_CODES.MODULE_NOT_FOUND,
    ERROR_CODES.STORAGE_CORRUPTED,
  ]

  return !nonRetryableCodes.includes(error.code) && error.retryable
}

// ============================================================================
// Operation State Utilities
// ============================================================================

/**
 * Create an initial operation state
 */
export function createInitialState<T>(): OperationState<T> {
  return {
    status: "idle",
    data: null,
    error: null,
  }
}

/**
 * Create a loading operation state
 */
export function createLoadingState<T>(previousState?: OperationState<T>): OperationState<T> {
  return {
    ...(previousState || createInitialState<T>()),
    status: "loading",
    error: null,
  }
}

/**
 * Create a success operation state
 */
export function createSuccessState<T>(data: T, previousState?: OperationState<T>): OperationState<T> {
  return {
    ...(previousState || createInitialState<T>()),
    status: "success",
    data,
    error: null,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Create an error operation state
 */
export function createErrorState<T>(error: AppError, previousState?: OperationState<T>): OperationState<T> {
  return {
    ...(previousState || createInitialState<T>()),
    status: "error",
    error,
  }
}

/**
 * Create a degraded operation state (partial functionality)
 */
export function createDegradedState<T>(data: T, error: AppError, previousState?: OperationState<T>): OperationState<T> {
  return {
    ...(previousState || createInitialState<T>()),
    status: "degraded",
    data,
    error,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Reset an operation state to idle
 */
export function resetState<T>(state?: OperationState<T>): OperationState<T> {
  return createInitialState<T>()
}

// ============================================================================
// Error Logging
// ============================================================================

interface ErrorLogEntry {
  errorId: string
  error: AppError
  componentStack?: string
  userAgent: string
  url: string
  timestamp: string
}

/**
 * Log an error to the console (and would send to Sentry in production)
 */
export function logError(error: AppError, componentStack?: string): void {
  const entry: ErrorLogEntry = {
    errorId: error.errorId || generateErrorId(),
    error,
    componentStack,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    timestamp: new Date().toISOString(),
  }

  // Console logging for development
  console.error(`[Error ${entry.errorId}]`, {
    code: error.code,
    message: error.userMessage,
    retryable: error.retryable,
    context: error.context,
  })

  if (error.cause) {
    setContext("appError", {
      errorId: entry.errorId,
      code: error.code,
      userMessage: error.userMessage,
      retryable: error.retryable,
      context: error.context,
      componentStack,
    })
    captureException(error.cause)
  } else {
    // If no cause, capture as message with context
    addBreadcrumb(error.userMessage, "error", "error", {
      errorId: entry.errorId,
      code: error.code,
      context: error.context,
    })
  }

  // Store recent errors for debugging
  storeRecentError(entry)
}

/**
 * Store recent errors for debugging
 */
const MAX_RECENT_ERRORS = 10
const recentErrors: ErrorLogEntry[] = []

function storeRecentError(entry: ErrorLogEntry): void {
  recentErrors.unshift(entry)
  if (recentErrors.length > MAX_RECENT_ERRORS) {
    recentErrors.pop()
  }

  // Also store in sessionStorage for debugging
  try {
    const stored = sessionStorage.getItem("recentErrors")
    const existing: ErrorLogEntry[] = stored ? JSON.parse(stored) : []

    // Scrub sensitive data from entry
    const scrubbedContext = entry.error.context
      ? (scrubSensitiveData(entry.error.context) as Record<string, unknown>)
      : undefined
    const scrubbedEntry = {
      ...entry,
      error: {
        ...entry.error,
        context: scrubbedContext,
      },
    }

    existing.unshift(scrubbedEntry)
    const trimmed = existing.slice(0, MAX_RECENT_ERRORS)
    sessionStorage.setItem("recentErrors", JSON.stringify(trimmed))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get recent errors for debugging
 */
export function getRecentErrors(): ErrorLogEntry[] {
  return [...recentErrors]
}

/**
 * Clear recent errors
 */
export function clearRecentErrors(): void {
  recentErrors.length = 0
  try {
    sessionStorage.removeItem("recentErrors")
  } catch {
    // Ignore
  }
}

// ============================================================================
// Retry Logic
// ============================================================================

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  jitter?: boolean
  retryableCodes?: ErrorCode[]
  nonRetryableCodes?: ErrorCode[]
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateRetryDelay(attempt: number, options: RetryOptions): number {
  const { baseDelay = 1000, maxDelay = 30000, backoffMultiplier = 2, jitter = true } = options

  let delay = baseDelay * Math.pow(backoffMultiplier, attempt)
  delay = Math.min(delay, maxDelay)

  if (jitter) {
    // Add random jitter of ±25%
    const jitterFactor = 0.75 + Math.random() * 0.5
    delay = Math.floor(delay * jitterFactor)
  }

  return delay
}

/**
 * Check if an error is retryable based on options
 */
export function shouldRetry(error: AppError, options: RetryOptions): boolean {
  // Check explicit non-retryable codes first
  if (options.nonRetryableCodes?.includes(error.code)) {
    return false
  }

  // Check if explicitly retryable
  if (options.retryableCodes?.includes(error.code)) {
    return true
  }

  // Use the error's own retryable flag
  return error.retryable
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3 } = options

  let lastError: AppError | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const appError = toAppError(error)
      lastError = appError

      if (!shouldRetry(appError, options) || attempt >= maxRetries) {
        throw appError
      }

      const delay = calculateRetryDelay(attempt, options)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}

// ============================================================================
// Sensitive Data Scrubbing
// ============================================================================

/**
 * Scrub sensitive data before storing
 */
function scrubSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(scrubSensitiveData)
  }

  const scrubbed: Record<string, unknown> = {}
  const sensitiveKeys = ["apikey", "api_key", "apikey", "token", "password", "secret", "authorization"]

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      scrubbed[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      scrubbed[key] = scrubSensitiveData(value)
    } else {
      scrubbed[key] = value
    }
  }

  return scrubbed
}
