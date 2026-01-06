/**
 * Client-side Rate Limiter
 * Prevents excessive API calls and protects against cost runaway
 */

interface RateLimitConfig {
  maxRequestsPerMinute: number
  maxRequestsPerHour: number
  maxRequestsPerDay: number
  maxCostPerDay: number // In USD
}

interface RequestRecord {
  timestamp: number
  cost: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 500,
  maxCostPerDay: 5.0, // $5 per day
}

// Estimated costs per request (in USD)
const COST_ESTIMATES = {
  "gpt-4o-mini": 0.002, // ~$0.002 per request
  "gpt-4o": 0.01, // ~$0.01 per request
  "gpt-4": 0.03, // ~$0.03 per request
}

class RateLimiter {
  private requests: RequestRecord[] = []
  private config: RateLimitConfig
  private storageKey = "nutriai_rate_limit"

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.loadFromStorage()
  }

  /**
   * Check if a request is allowed
   */
  public canMakeRequest(model = "gpt-4o-mini"): {
    allowed: boolean
    reason?: string
    resetIn?: number
    currentUsage: {
      perMinute: number
      perHour: number
      perDay: number
      costToday: number
    }
  } {
    this.cleanup()

    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    const recentMinute = this.requests.filter((r) => r.timestamp > oneMinuteAgo)
    const recentHour = this.requests.filter((r) => r.timestamp > oneHourAgo)
    const recentDay = this.requests.filter((r) => r.timestamp > oneDayAgo)
    const costToday = recentDay.reduce((sum, r) => sum + r.cost, 0)

    const currentUsage = {
      perMinute: recentMinute.length,
      perHour: recentHour.length,
      perDay: recentDay.length,
      costToday,
    }

    // Check per-minute limit
    if (recentMinute.length >= this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit: Maximum ${this.config.maxRequestsPerMinute} requests per minute`,
        resetIn: 60,
        currentUsage,
      }
    }

    // Check per-hour limit
    if (recentHour.length >= this.config.maxRequestsPerHour) {
      const oldestInHour = Math.min(...recentHour.map((r) => r.timestamp))
      const resetIn = Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000)
      return {
        allowed: false,
        reason: `Rate limit: Maximum ${this.config.maxRequestsPerHour} requests per hour`,
        resetIn,
        currentUsage,
      }
    }

    // Check per-day limit
    if (recentDay.length >= this.config.maxRequestsPerDay) {
      const oldestInDay = Math.min(...recentDay.map((r) => r.timestamp))
      const resetIn = Math.ceil((oldestInDay + 24 * 60 * 60 * 1000 - now) / 1000)
      return {
        allowed: false,
        reason: `Daily limit: Maximum ${this.config.maxRequestsPerDay} requests per day`,
        resetIn,
        currentUsage,
      }
    }

    // Check cost limit
    const estimatedCost = COST_ESTIMATES[model as keyof typeof COST_ESTIMATES] || COST_ESTIMATES["gpt-4o-mini"]
    if (costToday + estimatedCost > this.config.maxCostPerDay) {
      return {
        allowed: false,
        reason: `Daily cost limit: Maximum $${this.config.maxCostPerDay.toFixed(2)} per day (current: $${costToday.toFixed(2)})`,
        resetIn: 86400,
        currentUsage,
      }
    }

    return { allowed: true, currentUsage }
  }

  /**
   * Record a request
   */
  public recordRequest(model = "gpt-4o-mini"): void {
    const cost = COST_ESTIMATES[model as keyof typeof COST_ESTIMATES] || COST_ESTIMATES["gpt-4o-mini"]
    this.requests.push({
      timestamp: Date.now(),
      cost,
    })
    this.saveToStorage()
  }

  /**
   * Get current usage statistics
   */
  public getUsage(): {
    perMinute: number
    perHour: number
    perDay: number
    costToday: number
    limits: RateLimitConfig
  } {
    this.cleanup()

    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    const recentMinute = this.requests.filter((r) => r.timestamp > oneMinuteAgo)
    const recentHour = this.requests.filter((r) => r.timestamp > oneHourAgo)
    const recentDay = this.requests.filter((r) => r.timestamp > oneDayAgo)
    const costToday = recentDay.reduce((sum, r) => sum + r.cost, 0)

    return {
      perMinute: recentMinute.length,
      perHour: recentHour.length,
      perDay: recentDay.length,
      costToday,
      limits: this.config,
    }
  }

  /**
   * Reset all limits (admin function)
   */
  public reset(): void {
    this.requests = []
    this.saveToStorage()
  }

  /**
   * Remove old requests
   */
  private cleanup(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.requests = this.requests.filter((r) => r.timestamp > oneDayAgo)
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.requests))
    } catch (error) {
      console.error("Failed to save rate limit data:", error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.requests = JSON.parse(stored)
        this.cleanup()
      }
    } catch (error) {
      console.error("Failed to load rate limit data:", error)
      this.requests = []
    }
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}

export default RateLimiter
