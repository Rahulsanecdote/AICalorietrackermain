"use client"

/**
 * Enhanced Nutrition AI Hook with Circuit Breaker Protection
 * Provides stable state machine pattern for food analysis with robust error handling
 */

import { useState, useCallback, useRef, useEffect } from "react"
import type { AIResponse } from "../types"
import { API_CONFIG, CALORIE_TOLERANCE } from "../constants"
import { postAIChat } from "../utils/aiClient"
import {
  type OperationState,
  createInitialState,
  createLoadingState,
  createSuccessState,
  createErrorState,
  type AppError,
  toAppError,
  classifyValidationError,
  classifyApiError,
  classifyParseError,
  logError,
  ERROR_CODES,
} from "../utils/errors"
import {
  OpenAICircuitBreaker,
  withCircuitBreaker,
  calculateRateLimitDelay,
  type CircuitBreakerStateInfo,
  type CircuitBreakerMetrics,
} from "../utils/circuitBreaker"
import { sanitizePromptInput } from "../utils/promptSanitization"
import { getRateLimiter } from "../utils/rateLimiter"

// ============================================================================
// Types
// ============================================================================

interface UseNutritionAIResult extends OperationState<AIResponse> {
  analyzeFood: (description: string) => Promise<AIResponse | null>
  cancel: () => void
  isLoading: boolean
  circuitState: CircuitBreakerStateInfo
  circuitMetrics: CircuitBreakerMetrics
  resetCircuit: () => void
}

interface UseNutritionAIOptions {
  onSuccess?: (data: AIResponse) => void
  onError?: (error: AppError) => void
  maxRetries?: number
}

// ============================================================================
// Singleton Circuit Breaker for Nutrition AI
// ============================================================================

let nutritionCircuitBreaker: OpenAICircuitBreaker<AIResponse> | null = null

function getNutritionCircuitBreaker(): OpenAICircuitBreaker<AIResponse> {
  if (!nutritionCircuitBreaker) {
    nutritionCircuitBreaker = OpenAICircuitBreaker.getInstance<AIResponse>("nutrition-ai")
  }
  return nutritionCircuitBreaker
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useNutritionAI = (options: UseNutritionAIOptions = {}): UseNutritionAIResult => {
  const { onSuccess, onError } = options

  const [state, setState] = useState<OperationState<AIResponse>>(createInitialState())
  const [circuitState, setCircuitState] = useState<CircuitBreakerStateInfo>(getNutritionCircuitBreaker().getState())
  const [circuitMetrics, setCircuitMetrics] = useState<CircuitBreakerMetrics>(getNutritionCircuitBreaker().getMetrics())
  const abortControllerRef = useRef<AbortController | null>(null)

  // Subscribe to circuit breaker state and metrics changes
  useEffect(() => {
    const breaker = getNutritionCircuitBreaker()
    const unsubscribe = breaker.subscribe((info) => {
      setCircuitState(info)
    })

    // Also subscribe to metrics updates
    const metricsInterval = setInterval(() => {
      setCircuitMetrics(breaker.getMetrics())
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(metricsInterval)
    }
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setState((prev) => ({ ...prev, status: "idle" }))
  }, [])

  const resetCircuit = useCallback(() => {
    getNutritionCircuitBreaker().reset()
  }, [])

  const analyzeFood = useCallback(
    async (description: string): Promise<AIResponse | null> => {
      // Sanitize input to prevent prompt injection
      const sanitized = sanitizePromptInput(description)
      if (!sanitized.isValid) {
        const error = classifyValidationError("empty_input", sanitized.warnings.join(", ") || "Invalid input", false)
        logError(error)
        setState(createErrorState(error))
        onError?.(error)
        return null
      }

      // Check rate limits
      const rateLimiter = getRateLimiter()
      const rateLimitCheck = rateLimiter.canMakeRequest(API_CONFIG.MODEL)

      if (!rateLimitCheck.allowed) {
        const error: AppError = {
          code: ERROR_CODES.API_RATE_LIMITED,
          userMessage: rateLimitCheck.reason || "Rate limit exceeded",
          retryable: true,
          timestamp: new Date().toISOString(),
          context: {
            resetIn: rateLimitCheck.resetIn,
            currentUsage: rateLimitCheck.currentUsage,
          },
        }
        logError(error)
        setState(createErrorState(error))
        onError?.(error)
        return null
      }

      // Create abort controller for cancellation support
      abortControllerRef.current = new AbortController()
      setState(createLoadingState(state))

      const systemPrompt = `You are a nutritional analysis API. Your task is to analyze food descriptions and return accurate nutritional estimates in JSON format.

Rules:
1. Always return valid JSON
2. Estimate calories and macronutrients based on standard serving sizes
3. Be reasonably accurate for common foods
4. If you cannot identify the food, return null for all values except foodName which should be "Unknown"
5. Include reasonable estimates even for ambiguous descriptions

Output format:
{
  "foodName": "string",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "servingSize": "string"
}`

      const userPrompt = `Analyze this food description and return nutritional information: "${sanitized.sanitized}"

Respond with only the JSON object, no markdown formatting, no additional text.`

      try {
        const breaker = getNutritionCircuitBreaker()
        const circuitStateInfo = breaker.getState()

        // Check if circuit is open
        if (circuitStateInfo.state === "open") {
          const waitTime = circuitStateInfo.nextAttemptTime
            ? new Date(circuitStateInfo.nextAttemptTime).getTime() - Date.now()
            : 0

          const error: AppError = {
            code: ERROR_CODES.API_SERVICE_UNAVAILABLE,
            userMessage: `AI analysis temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds and try again.`,
            retryable: false,
            timestamp: new Date().toISOString(),
          }

          logError(error)
          setState(createErrorState(error))
          onError?.(error)
          return null
        }

        // Execute with circuit breaker protection
        const result = await withCircuitBreaker<AIResponse>({
          circuitBreaker: breaker,
          backoffOptions: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            multiplier: 2,
            jitter: true,
            retryableStatusCodes: [429, 500, 502, 503, 504],
          },
          timeoutMs: 30000,
          abortSignal: abortControllerRef.current?.signal,
          request: {
            prompt: sanitized.sanitized,
            model: API_CONFIG.MODEL,
            context: {
              model: API_CONFIG.MODEL,
              temperature: API_CONFIG.TEMPERATURE,
              systemPromptVersion: "nutrition-v1",
            },
          },
          onCircuitOpen: (waitTime) => {
            const error: AppError = {
              code: ERROR_CODES.API_SERVICE_UNAVAILABLE,
              userMessage: `AI service is experiencing high demand. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
              retryable: true,
              timestamp: new Date().toISOString(),
            }
            logError(error)
            setState(createErrorState(error))
          },
          onError: (_error, attempt) => {
            console.log(`[NutritionAI] Circuit breaker attempt ${attempt}`)
          },
          onSuccess: (_data, attempt) => {
            if (attempt > 0) {
              console.log(`[NutritionAI] Recovery successful on attempt ${attempt}`)
            }
          },
          executor: async () => {
            const requestBody = {
              model: API_CONFIG.MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: API_CONFIG.TEMPERATURE,
              max_tokens: API_CONFIG.MAX_TOKENS,
            }

            const response = await postAIChat(requestBody, {
              signal: abortControllerRef.current?.signal,
            })

            // Handle HTTP errors
            if (!response.ok) {
              let errorData: Record<string, unknown> = {}
              try {
                errorData = await response.json().catch(() => ({}))
              } catch {
                // Ignore JSON parse errors
              }

              // Check for rate limiting (429)
              if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After")
                const delay = calculateRateLimitDelay(retryAfter ? Number.parseInt(retryAfter, 10) : undefined)

                // Add delay before throwing to respect rate limit
                await new Promise((resolve) => setTimeout(resolve, delay))
              }

              const error = classifyApiError(response.status, errorData, {
                operation: "analyzeFood",
                descriptionLength: sanitized.sanitized.length,
              })

              throw error
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            if (!content) {
              throw toAppError(new Error("No response from AI service"), {
                operation: "analyzeFood",
              })
            }

            // Clean up the response (remove markdown code blocks if present)
            const cleanedContent = content.replace(/```json\s*|\s*```/g, "").trim()

            let parsedResponse: AIResponse
            try {
              parsedResponse = JSON.parse(cleanedContent)
            } catch (parseError) {
              const error = classifyParseError(parseError as Error, {
                operation: "analyzeFood",
                rawResponse: content.substring(0, 100),
              })
              throw error
            }

            // Validate the response has required fields
            if (!parsedResponse.foodName || typeof parsedResponse.calories !== "number") {
              throw toAppError(new Error("AI returned invalid response format"), {
                operation: "analyzeFood",
                parsedResponse,
              })
            }

            // Validate nutrition values are reasonable
            if (parsedResponse.calories < 0 || parsedResponse.calories > 5000) {
              console.warn("AI returned unusual calorie value:", parsedResponse.calories)
            }

            // Apply calorie tolerance check
            const reasonableCalories = Math.abs(parsedResponse.calories - CALORIE_TOLERANCE) <= CALORIE_TOLERANCE * 10
            if (!reasonableCalories) {
              console.warn("AI returned unusual calorie value:", parsedResponse.calories)
            }

            rateLimiter.recordRequest(API_CONFIG.MODEL)

            return parsedResponse
          },
        })

        setState(createSuccessState(result, state))
        onSuccess?.(result)
        return result
      } catch (err) {
        // Handle cancellation gracefully
        if (err instanceof DOMException && err.name === "AbortError") {
          console.log("Request cancelled by user")
          setState((prev) => ({ ...prev, status: "idle" }))
          return null
        }

        const appError = toAppError(err, { operation: "analyzeFood" })

        // Don't log circuit breaker "service unavailable" errors as they're expected
        if (appError.code !== ERROR_CODES.API_SERVICE_UNAVAILABLE) {
          logError(appError)
        }

        setState(createErrorState(appError, state))
        onError?.(appError)
        return null
      } finally {
        setState((prev) => ({ ...prev, status: "idle" }))
        abortControllerRef.current = null
      }
    },
    [state, onSuccess, onError],
  )

  return {
    ...state,
    analyzeFood,
    cancel,
    isLoading: state.status === "loading",
    circuitState,
    circuitMetrics,
    resetCircuit,
  }
}

export default useNutritionAI
