/**
 * Circuit Breaker Pattern Implementation for API Calls
 * Provides protection against repeated API failures with automatic recovery
 *
 * IMPORTANT: This is a client-side circuit breaker. It provides UX benefits
 * but does not protect against rate-limit meltdowns across your user base.
 * The real protection belongs on the backend.
 */

import { AppError, isRetryableError, ERROR_CODES } from './errors';

// ============================================================================
// Types
// ============================================================================

type CircuitBreakerState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms to stay open before attempting half-open */
  cooldownMs: number;
  /** Success threshold to close circuit from half-open */
  successThreshold: number;
  /** Request timeout in ms */
  timeoutMs: number;
  /** Enable caching of identical requests */
  enableCache: boolean;
  /** Cache TTL in ms */
  cacheTtlMs: number;
  /** Maximum cache entries (LRU) */
  maxCacheSize: number;
  /** Enable in-flight request deduplication */
  enableDedupe: boolean;
  /** Enable metrics tracking */
  enableMetrics: boolean;
}

interface CircuitBreakerStateInfo {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: string | null;
  lastSuccessTime: string | null;
  nextAttemptTime: string | null;
  requestCount: number;
  cachedCount: number;
  halfOpenInFlight: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
  context: RequestContext;
}

interface RequestContext {
  model: string;
  temperature: number;
  systemPromptVersion?: string;
  userLanguage?: string;
}

interface CircuitBreakerMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  failuresByCode: Record<string, number>;
  stateTransitions: { from: CircuitBreakerState; to: CircuitBreakerState; timestamp: string }[];
  dedupeHits: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,          // Open after 5 consecutive failures
  cooldownMs: 60000,            // 60 second cooldown
  successThreshold: 3,          // Need 3 successes to close from half-open
  timeoutMs: 30000,             // 30 second timeout
  enableCache: true,            // Enable request caching
  cacheTtlMs: 30000,            // 30 second cache TTL
  maxCacheSize: 100,            // LRU cache max entries
  enableDedupe: true,           // Enable in-flight request dedupe
  enableMetrics: true,          // Enable metrics tracking
};

// ============================================================================
// Circuit Breaker Class
// ============================================================================

export class CircuitBreaker<T = unknown> {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private requestCount = 0;
  private cachedCount = 0;
  private cache: Map<string, CacheEntry<T>> = new Map();
  private inFlightPromises: Map<string, Promise<T>> = new Map();
  private halfOpenInFlight = 0;
  private listeners: Set<(info: CircuitBreakerStateInfo) => void> = new Set();

  // Metrics tracking
  private metrics: CircuitBreakerMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    failuresByCode: {},
    stateTransitions: [],
    dedupeHits: 0,
  };

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // State Management
  // ============================================================================

  getState(): CircuitBreakerStateInfo {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastSuccessTime: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime).toISOString() : null,
      requestCount: this.requestCount,
      cachedCount: this.cachedCount,
      halfOpenInFlight: this.halfOpenInFlight,
    };
  }

  private setState(newState: CircuitBreakerState): void {
    if (this.state !== newState) {
      const fromState = this.state;
      this.state = newState;
      this.notifyListeners();

      // Track state transition in metrics
      if (this.config.enableMetrics) {
        this.metrics.stateTransitions.push({
          from: fromState,
          to: newState,
          timestamp: new Date().toISOString(),
        });
      }

      console.warn(`[CircuitBreaker] State: ${fromState} -> ${newState}`);
    }
  }

  /**
   * Record a failure - only counts if error is retryable
   * Non-retryable errors (401/403, validation) should NOT trip the breaker
   */
  private recordFailure(error: Error): void {
    // Check if this is a retryable error
    const isRetryable = this.isRetryableError(error);

    if (isRetryable) {
      this.failureCount++;
    }

    this.lastFailureTime = Date.now();
    this.requestCount++;

    // Track failure by code/type
    if (this.config.enableMetrics) {
      const code = this.categorizeError(error);
      this.metrics.failuresByCode[code] = (this.metrics.failuresByCode[code] || 0) + 1;
    }

    // Only trip circuit for retryable errors
    if (isRetryable) {
      if (this.failureCount >= this.config.failureThreshold && this.state === 'closed') {
        this.open();
      } else if (this.state === 'half-open') {
        this.halfOpenInFlight--;
        if (this.halfOpenInFlight < 0) this.halfOpenInFlight = 0;
        if (this.failureCount >= this.config.failureThreshold) {
          this.open();
        }
      }
    }
  }

  private recordSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();
    this.requestCount++;

    if (this.state === 'half-open') {
      this.halfOpenInFlight--;
      if (this.halfOpenInFlight < 0) this.halfOpenInFlight = 0;
      if (this.successCount >= this.config.successThreshold) {
        this.close();
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Determine if an error should count toward circuit tripping
   * Non-retryable errors (401/403, schema errors) should NOT trip the breaker
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Non-retryable: Auth errors
    if (message.includes('401') || message.includes('403') ||
        message.includes('unauthorized') || message.includes('forbidden') ||
        message.includes('api key')) {
      return false;
    }

    // Non-retryable: Schema/parse errors from model response
    if (message.includes('invalid response format') ||
        message.includes('ai returned incomplete') ||
        message.includes('json parse error') ||
        message.includes('schema')) {
      return false;
    }

    // Non-retryable: Client-side validation errors
    if (message.includes('validation') || message.includes('invalid input') ||
        message.includes('missing required')) {
      return false;
    }

    // Retryable: Network errors, timeouts, rate limits, server errors
    if (message.includes('fetch') || message.includes('network') ||
        message.includes('timeout') || message.includes('rate limit') ||
        message.includes('429') || message.includes('503') ||
        message.includes('service unavailable') ||
        message.includes('temporarily unavailable')) {
      return true;
    }

    // Default: be conservative and count as failure (but not retryable for circuit)
    // This ensures the circuit doesn't trip on unknown errors
    return false;
  }

  /**
   * Categorize error for metrics tracking
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('401') || message.includes('unauthorized')) return 'UNAUTHORIZED';
    if (message.includes('403') || message.includes('forbidden')) return 'FORBIDDEN';
    if (message.includes('429') || message.includes('rate limit')) return 'RATE_LIMIT';
    if (message.includes('500') || message.includes('server error')) return 'SERVER_ERROR';
    if (message.includes('503') || message.includes('unavailable')) return 'SERVICE_UNAVAILABLE';
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
    if (message.includes('parse') || message.includes('schema') || message.includes('invalid response')) return 'PARSE_ERROR';

    return 'UNKNOWN';
  }

  // ============================================================================
  // Circuit State Transitions
  // ============================================================================

  private open(): void {
    this.state = 'open';
    this.nextAttemptTime = Date.now() + this.config.cooldownMs;
    this.notifyListeners();

    console.warn(`[CircuitBreaker] Circuit OPENED. Will retry after ${this.config.cooldownMs}ms`);
  }

  private close(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;
    this.notifyListeners();

    console.log(`[CircuitBreaker] Circuit CLOSED. Normal operation resumed.`);
  }

  private halfOpen(): void {
    this.state = 'half-open';
    this.successCount = 0;
    this.failureCount = 0;
    this.nextAttemptTime = null;
    this.halfOpenInFlight = 0;
    this.notifyListeners();

    console.log(`[CircuitBreaker] Circuit HALF-OPEN. Testing recovery...`);
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  private generateCacheKey(request: { prompt: string; model?: string; context?: RequestContext }): string {
    const keyData = {
      prompt: request.prompt,
      model: request.model || 'default',
      temperature: request.context?.temperature ?? 0.7,
      systemPromptVersion: request.context?.systemPromptVersion ?? 'v1',
      userLanguage: request.context?.userLanguage ?? 'en',
    };

    const str = JSON.stringify(keyData);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `cache_${hash.toString(16)}`;
  }

  private getCachedResult(hash: string): T | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.config.cacheTtlMs;
    if (isExpired) {
      this.cache.delete(hash);
      return null;
    }

    return entry.data;
  }

  private setCachedResult(hash: string, data: T, context: RequestContext): void {
    // LRU eviction: remove oldest entries if over limit
    if (this.cache.size >= this.config.maxCacheSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(hash, {
      data,
      timestamp: Date.now(),
      hash,
      context,
    });
  }

  clearCache(): void {
    this.cache.clear();
    this.cachedCount = 0;
  }

  // ============================================================================
  // Metrics
  // ============================================================================

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  // ============================================================================
  // Request Execution
  // ============================================================================

  async execute(
    request: { prompt: string; model?: string; context?: RequestContext },
    executor: () => Promise<T>,
    abortSignal?: AbortSignal
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(request);
    const context = request.context || { model: request.model || 'default', temperature: 0.7 };

    // Increment total requests
    this.metrics.totalRequests++;

    // Check cache first
    if (this.config.enableCache) {
      const cached = this.getCachedResult(cacheKey);
      if (cached !== null) {
        this.cachedCount++;
        this.metrics.cacheHits++;
        console.log(`[CircuitBreaker] Cache HIT`);
        return cached;
      }
      this.metrics.cacheMisses++;
    }

    // Check for in-flight duplicate request
    if (this.config.enableDedupe) {
      const existingPromise = this.inFlightPromises.get(cacheKey);
      if (existingPromise) {
        this.metrics.dedupeHits++;
        console.log(`[CircuitBreaker] In-flight dedupe HIT`);

        // If the existing request is aborted, don't return it
        try {
          return await existingPromise;
        } catch {
          // If it failed, we'll try to create a new one below
        }
      }
    }

    // Check circuit state
    if (this.state === 'open') {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime) {
        const waitTime = this.nextAttemptTime - Date.now();
        throw new Error(`AI service temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds and try again.`);
      }
      // Time to try half-open
      this.halfOpen();
    }

    // Half-open: only allow one in-flight probe
    if (this.state === 'half-open') {
      if (this.halfOpenInFlight > 0) {
        throw new Error('Circuit breaker is testing recovery. Please wait.');
      }
      this.halfOpenInFlight = 1;
    }

    // Create the promise and track it
    const promise = (async () => {
      // Setup abort handling
      const abortHandler = () => {
        this.inFlightPromises.delete(cacheKey);
        // Don't count aborted requests as failures
      };

      if (abortSignal) {
        abortSignal.addEventListener('abort', abortHandler);
      }

      try {
        // Execute with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Request timeout. The AI service is taking too long to respond.'));
          }, this.config.timeoutMs);

          if (abortSignal) {
            abortSignal.addEventListener('abort', () => clearTimeout(timeoutId));
          }
        });

        const result = await Promise.race([
          executor(),
          timeoutPromise,
        ]);

        // Cache successful result
        if (this.config.enableCache) {
          this.setCachedResult(cacheKey, result, context);
        }

        this.recordSuccess();
        return result;

      } catch (error) {
        // Handle abort specially - don't count as failure
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log(`[CircuitBreaker] Request aborted, not counting as failure`);
          this.inFlightPromises.delete(cacheKey);
          throw error;
        }

        this.recordFailure(error as Error);
        throw error;

      } finally {
        this.inFlightPromises.delete(cacheKey);
        if (abortSignal) {
          abortSignal.removeEventListener('abort', abortHandler);
        }
      }
    })();

    // Track in-flight promise for deduplication
    this.inFlightPromises.set(cacheKey, promise);

    return promise;
  }

  // ============================================================================
  // Force State Changes (for testing/admin)
  // ============================================================================

  forceOpen(): void {
    this.open();
  }

  forceClose(): void {
    this.close();
  }

  forceHalfOpen(): void {
    this.halfOpen();
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
    this.requestCount = 0;
    this.cachedCount = 0;
    this.halfOpenInFlight = 0;
    this.inFlightPromises.clear();
    this.clearCache();
    this.notifyListeners();

    // Reset metrics
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      failuresByCode: {},
      stateTransitions: [],
      dedupeHits: 0,
    };
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  subscribe(listener: (info: CircuitBreakerStateInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const info = this.getState();
    this.listeners.forEach(listener => listener(info));
  }
}

// ============================================================================
// Specialized Circuit Breaker for OpenAI
// ============================================================================

export class OpenAICircuitBreaker extends CircuitBreaker {
  private static instances: Map<string, OpenAICircuitBreaker> = new Map();

  static getInstance(operation: string): OpenAICircuitBreaker {
    if (!this.instances.has(operation)) {
      this.instances.set(operation, new OpenAICircuitBreaker());
    }
    return this.instances.get(operation)!;
  }

  static resetAll(): void {
    this.instances.forEach(breaker => breaker.reset());
    this.instances.clear();
  }

  static getAllStates(): Record<string, CircuitBreakerStateInfo> {
    const states: Record<string, CircuitBreakerStateInfo> = {};
    this.instances.forEach((breaker, operation) => {
      states[operation] = breaker.getState();
    });
    return states;
  }

  static getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    this.instances.forEach((breaker, operation) => {
      metrics[operation] = breaker.getMetrics();
    });
    return metrics;
  }

  private constructor() {
    super({
      failureThreshold: 5,        // Open after 5 failures
      cooldownMs: 60000,          // 60 second cooldown for AI services
      successThreshold: 3,        // 3 successes to fully close
      timeoutMs: 30000,           // 30 second timeout
      enableCache: true,          // Cache identical requests
      cacheTtlMs: 30000,          // 30 second cache for AI responses
      maxCacheSize: 100,          // LRU cache max entries
      enableDedupe: true,         // Enable in-flight request dedupe
      enableMetrics: true,        // Enable metrics tracking
    });
  }
}

// ============================================================================
// Exponential Backoff with Jitter
// ============================================================================

interface BackoffOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Base delay in ms */
  baseDelay?: number;
  /** Maximum delay in ms */
  maxDelay?: number;
  /** Backoff multiplier */
  multiplier?: number;
  /** Add random jitter */
  jitter?: boolean;
  /** Retry on these HTTP status codes */
  retryableStatusCodes?: number[];
}

const DEFAULT_BACKOFF_OPTIONS: BackoffOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
  jitter: true,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

/**
 * Execute a function with exponential backoff and jitter
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_BACKOFF_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries!; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = await shouldRetryError(error, config);

      if (!shouldRetry || attempt >= config.maxRetries!) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = config.baseDelay! * Math.pow(config.multiplier!, attempt);
      let delay = Math.min(baseDelay, config.maxDelay!);

      if (config.jitter) {
        // Add ±25% jitter
        const jitterFactor = 0.75 + Math.random() * 0.5;
        delay = Math.floor(delay * jitterFactor);
      }

      console.log(`[Backoff] Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Determine if an error should be retried
 */
async function shouldRetryError(
  error: unknown,
  options: BackoffOptions
): Promise<boolean> {
  // Network errors are always retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Check for timeout
  if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
    return true;
  }

  // Check HTTP status code if available
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    if (typeof err.status === 'number') {
      const status = err.status as number;
      if (options.retryableStatusCodes?.includes(status)) {
        return status !== 429; // 429 has special handling
      }
    }

    // Check for 429 specifically (rate limiting)
    if (err.status === 429 || (err.message && err.message.toString().includes('rate'))) {
      return true;
    }

    // Non-retryable auth errors
    if (err.status === 401 || err.status === 403) {
      return false;
    }

    // Non-retryable schema/parse errors
    if (err.message && (
      err.message.toString().includes('invalid response format') ||
      err.message.toString().includes('schema') ||
      err.message.toString().includes('ai returned incomplete')
    )) {
      return false;
    }
  }

  return false;
}

/**
 * Calculate appropriate delay for rate limiting (429 responses)
 */
export function calculateRateLimitDelay(retryAfterHeader?: number): number {
  const baseDelay = 1000; // 1 second base
  const maxDelay = 60000; // 1 minute max

  if (retryAfterHeader) {
    // Use the Retry-After header value (usually seconds)
    return Math.min(retryAfterHeader * 1000, maxDelay);
  }

  // Exponential backoff starting at 1 second
  return Math.min(baseDelay, maxDelay);
}

// ============================================================================
// Combined API Call with Circuit Breaker and Backoff
// ============================================================================

interface ApiCallOptions<T> {
  /** The circuit breaker instance */
  circuitBreaker?: CircuitBreaker<T>;
  /** Backoff options */
  backoffOptions?: BackoffOptions;
  /** Request timeout in ms */
  timeoutMs?: number;
  /** Function to execute */
  executor: () => Promise<T>;
  /** Request identifier for caching */
  request?: { prompt: string; model?: string; context?: RequestContext };
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
  /** Called on circuit open */
  onCircuitOpen?: (waitTime: number) => void;
  /** Called on error */
  onError?: (error: Error, attempt: number) => void;
  /** Called on success */
  onSuccess?: (result: T, attempt: number) => void;
}

/**
 * Execute an API call with circuit breaker protection and exponential backoff
 */
export async function withCircuitBreaker<T>(options: ApiCallOptions<T>): Promise<T> {
  const {
    circuitBreaker,
    backoffOptions,
    timeoutMs = 30000,
    executor,
    request,
    abortSignal,
    onCircuitOpen,
    onError,
    onSuccess,
  } = options;

  const breaker = circuitBreaker || new CircuitBreaker<T>();

  // If circuit is open, throw immediately
  const state = breaker.getState();
  if (state.state === 'open' && state.nextAttemptTime) {
    const waitTime = new Date(state.nextAttemptTime).getTime() - Date.now();
    if (waitTime > 0) {
      onCircuitOpen?.(waitTime);
      throw new Error(`AI service temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds and try again.`);
    }
  }

  try {
    return await breaker.execute(
      request || { prompt: 'default' },
      async () => {
        return withExponentialBackoff(async () => {
          // Add timeout wrapper with abort signal
          const timeoutPromise = new Promise<never>((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Request timeout after ${timeoutMs}ms`));
            }, timeoutMs);

            if (abortSignal) {
              abortSignal.addEventListener('abort', () => clearTimeout(timeoutId));
            }
          });

          const resultPromise = executor();

          return await Promise.race([resultPromise, timeoutPromise]);
        }, backoffOptions);
      },
      abortSignal
    );
  } catch (error) {
    onError?.(error as Error, breaker.getState().requestCount);
    throw error;
  }
}

// ============================================================================
// Export Utilities
// ============================================================================

export { DEFAULT_CONFIG as CIRCUIT_BREAKER_DEFAULTS };
export type { CircuitBreakerStateInfo, CircuitBreakerMetrics, RequestContext };
