/**
 * Monitoring and observability utilities
 * Console-based implementation - no external dependencies required
 * To add Sentry later: npm install @sentry/react and update this file
 */

export interface MonitoringConfig {
  dsn?: string
  environment: "development" | "staging" | "production"
  release?: string
  tracesSampleRate: number
  replaysSessionSampleRate: number
  replaysOnErrorSampleRate: number
  enabled: boolean
}

let isInitialized = false
let currentConfig: MonitoringConfig | null = null
let currentUser: { id: string; data?: Record<string, unknown> } | null = null

/**
 * Initialize monitoring service
 */
export async function initializeMonitoring(config: MonitoringConfig): Promise<void> {
  currentConfig = config
  isInitialized = true

  if (!config.enabled) {
    console.info("[Monitoring] Disabled")
    return
  }

  console.info(`[Monitoring] Initialized for ${config.environment} environment`)
}

/**
 * Set user context for monitoring
 */
export async function setUserContext(userId: string, userData?: Record<string, unknown>): Promise<void> {
  if (!isInitialized) return
  currentUser = { id: userId, data: userData }
  console.info("[Monitoring] User context set:", userId)
}

/**
 * Clear user context (e.g., on logout)
 */
export async function clearUserContext(): Promise<void> {
  if (!isInitialized) return
  currentUser = null
  console.info("[Monitoring] User context cleared")
}

/**
 * Capture an exception to monitoring service
 */
export async function captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
  if (!isInitialized) {
    console.error("[Error]", error)
    return
  }

  console.error("[Monitoring] Exception captured:", error.message)
  console.error("[Monitoring] Stack:", error.stack)

  if (context) {
    console.error("[Monitoring] Context:", scrubSensitiveData(context))
  }

  if (currentUser) {
    console.error("[Monitoring] User:", currentUser.id)
  }
}

/**
 * Capture a message to monitoring service
 */
export async function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): Promise<void> {
  if (!isInitialized) {
    console.log(`[${level.toUpperCase()}] ${message}`)
    return
  }

  const logFn = level === "error" ? console.error : level === "warning" ? console.warn : console.info
  logFn(`[Monitoring] ${level}: ${message}`)
}

/**
 * Add breadcrumb for debugging context
 */
export async function addBreadcrumb(
  message: string,
  category: string,
  level: "info" | "warning" | "error" = "info",
  data?: Record<string, unknown>,
): Promise<void> {
  if (!isInitialized) return
  console.debug(`[Monitoring] Breadcrumb [${category}] ${message}`, data ? scrubSensitiveData(data) : "")
}

/**
 * Set custom tag for filtering errors
 */
export async function setTag(key: string, value: string): Promise<void> {
  if (!isInitialized) return
  console.debug(`[Monitoring] Tag set: ${key}=${value}`)
}

/**
 * Set custom context
 */
export async function setContext(name: string, context: Record<string, unknown>): Promise<void> {
  if (!isInitialized) return
  console.debug(`[Monitoring] Context [${name}]:`, scrubSensitiveData(context))
}

/**
 * Scrub sensitive data from objects
 */
function scrubSensitiveData(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(scrubSensitiveData)
  }

  const scrubbed: Record<string, unknown> = {}
  const sensitiveKeys = ["apiKey", "api_key", "token", "password", "secret", "apikey"]

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

/**
 * Get monitoring configuration from environment
 */
export function getMonitoringConfig(): MonitoringConfig {
  const environment = (import.meta.env.VITE_APP_ENV || import.meta.env.MODE) as "development" | "staging" | "production"

  return {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment,
    release: import.meta.env.VITE_APP_VERSION || "1.0.0",
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: environment === "production" ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    enabled: environment !== "development" || import.meta.env.VITE_ENABLE_MONITORING === "true",
  }
}
