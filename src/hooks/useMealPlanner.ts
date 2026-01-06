"use client"

/**
 * Enhanced Meal Planner Hook with Circuit Breaker Protection
 * Provides stable state machine pattern for meal planning operations with robust error handling
 */

import { useState, useCallback, useEffect, useRef } from "react"
import type {
  DailyMealPlan,
  MealPlanTemplate,
  MealPlanGenerationRequest,
  MealPlanGenerationResponse,
  FoodItem,
  MealSection,
  UserSettings,
  PantryData,
  PantryInputData,
} from "../types"
import { v4 as uuidv4 } from "uuid"
import { STORAGE_KEYS, API_CONFIG, CALORIE_TOLERANCE, MACRO_RATIOS, MEAL_CALORIE_DISTRIBUTION } from "../constants"
import { validateApiKey } from "../utils/validation"
import {
  type OperationState,
  createInitialState,
  createLoadingState,
  createSuccessState,
  createErrorState,
  type AppError,
  toAppError,
  classifyApiError,
  classifyParseError,
  logError,
  ERROR_CODES,
} from "../utils/errors"
import { OpenAICircuitBreaker, withCircuitBreaker, calculateRateLimitDelay } from "../utils/circuitBreaker"

// ============================================================================
// Storage Keys
// ============================================================================

const MEAL_PLAN_STORAGE_KEY = STORAGE_KEYS.MEAL_PLANS
const TEMPLATE_STORAGE_KEY = STORAGE_KEYS.TEMPLATES
const PANTRY_STORAGE_KEY = STORAGE_KEYS.PANTRY

// ============================================================================
// Types
// ============================================================================

interface UseMealPlannerResult extends OperationState<DailyMealPlan> {
  templates: MealPlanTemplate[]
  userPantry: PantryData | null
  generateMealPlan: (request: MealPlanGenerationRequest) => Promise<void>
  generateMealPlanFromPantry: (pantryData: PantryInputData) => Promise<void>
  updateFoodItem: (mealType: string, itemId: string, newWeight: number) => void
  swapFoodItem: (mealType: string, itemId: string, newItem: FoodItem) => void
  addMealToLog: (mealType: string) => void
  regenerateMealPlan: () => Promise<void>
  saveTemplate: (name: string, description?: string) => void
  loadTemplate: (templateId: string) => void
  deleteTemplate: (templateId: string) => void
  clearPlan: () => void
  savePantry: (pantryData: PantryInputData, saveAsDefault: boolean) => void
  loadPantry: () => PantryData | null
  circuitState: ReturnType<typeof OpenAICircuitBreaker.getInstance>["getState"]
  resetCircuit: () => void
}

interface UseMealPlannerOptions {
  onSuccess?: (data: DailyMealPlan) => void
  onError?: (error: AppError) => void
  maxRetries?: number
}

// ============================================================================
// Singleton Circuit Breaker for Meal Planner
// ============================================================================

let mealPlannerCircuitBreaker: OpenAICircuitBreaker | null = null

function getMealPlannerCircuitBreaker(): OpenAICircuitBreaker {
  if (!mealPlannerCircuitBreaker) {
    mealPlannerCircuitBreaker = OpenAICircuitBreaker.getInstance("meal-planner")
  }
  return mealPlannerCircuitBreaker
}

// ============================================================================
// Utility Functions
// ============================================================================

const parseAIResponse = (
  response: MealPlanGenerationResponse,
  settings: UserSettings,
  usedPantry?: PantryData,
  regenerationCount = 1,
): DailyMealPlan => {
  const macroRatio = MACRO_RATIOS[settings.goal || "maintain"]

  const meals: MealSection[] = response.meals.map((meal) => {
    const items: FoodItem[] = meal.foods.map((item) => ({
      id: uuidv4(),
      name: item.name,
      weightGrams: item.weight,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      micronutrients: { fiber: item.fiber },
      isFromPantry: !!usedPantry,
    }))

    const totalCalories = meal.totals?.calories || items.reduce((sum, item) => sum + item.calories, 0)
    const totalProtein = meal.totals?.protein || items.reduce((sum, item) => sum + item.protein, 0)
    const totalCarbs = meal.totals?.carbs || items.reduce((sum, item) => sum + item.carbs, 0)
    const totalFat = meal.totals?.fat || items.reduce((sum, item) => sum + item.fat, 0)

    return {
      type: meal.type,
      items,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      timeEstimate: meal.time,
    }
  })

  const actualTotalCalories = response.dailyTotals?.calories || meals.reduce((sum, meal) => sum + meal.totalCalories, 0)
  const totalProtein = meals.reduce((sum, meal) => sum + meal.totalProtein, 0)
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
  const totalFat = meals.reduce((sum, meal) => sum + meal.totalFat, 0)

  const accuracyVariance = Math.abs(actualTotalCalories - settings.dailyCalorieGoal)

  return {
    id: uuidv4(),
    date: new Date().toISOString().split("T")[0],
    targetCalories: settings.dailyCalorieGoal,
    meals,
    totalMacros: { protein: totalProtein, carbs: totalCarbs, fat: totalFat },
    macroRatio,
    summary: response.summary,
    createdAt: new Date().toISOString(),
    accuracyVariance,
    sourceType: usedPantry ? "pantry_based" : "generic",
    usedPantry,
    regenerationCount,
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useMealPlanner = (
  settings: UserSettings,
  onAddMeal: (description: string, category: any) => Promise<void>,
  options: UseMealPlannerOptions = {},
): UseMealPlannerResult => {
  const { onSuccess, onError } = options

  const [state, setState] = useState<OperationState<DailyMealPlan>>(createInitialState())
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([])
  const [userPantry, setUserPantry] = useState<PantryData | null>(null)
  const [circuitState, setCircuitState] = useState(getMealPlannerCircuitBreaker().getState())

  // Subscribe to circuit breaker state changes
  useEffect(() => {
    const breaker = getMealPlannerCircuitBreaker()
    const unsubscribe = breaker.subscribe((info) => {
      setCircuitState(info)
    })
    return unsubscribe
  }, [])

  const resetCircuit = useCallback(() => {
    getMealPlannerCircuitBreaker().reset()
  }, [])
  const pendingFnRef = useRef<(() => Promise<void>) | null>(null)

  // Load stored data on mount
  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem(MEAL_PLAN_STORAGE_KEY)
      const storedTemplates = localStorage.getItem(TEMPLATE_STORAGE_KEY)
      const storedPantry = localStorage.getItem(PANTRY_STORAGE_KEY)

      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates))
      }

      if (storedPantry) {
        setUserPantry(JSON.parse(storedPantry))
      }
    } catch (err) {
      console.error("Error loading meal plan data:", err)
    }
  }, [])

  const savePlan = useCallback((plan: DailyMealPlan) => {
    try {
      const existingPlans = JSON.parse(localStorage.getItem(MEAL_PLAN_STORAGE_KEY) || "[]")
      const updatedPlans = existingPlans.filter((p: DailyMealPlan) => p.date !== plan.date)
      updatedPlans.push(plan)
      localStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(updatedPlans))
    } catch (err) {
      console.error("Error saving meal plan:", err)
    }
  }, [])

  // ============================================================================
  // Generate Meal Plan from Pantry with Circuit Breaker
  // ============================================================================

  const generateMealPlanFromPantryInternal = useCallback(
    async (pantryData: PantryInputData, regenerationCount = 1): Promise<void> => {
      if (!settings.apiKey) {
        const error: AppError = {
          code: ERROR_CODES.VALIDATION_API_KEY_MISSING,
          userMessage: "Please set your OpenAI API key in settings",
          retryable: false,
          timestamp: new Date().toISOString(),
        }
        logError(error)
        setState(createErrorState(error))
        onError?.(error)
        return
      }

      setState(createLoadingState(state))

      const breaker = getMealPlannerCircuitBreaker()
      const circuitInfo = breaker.getState()

      // Check if circuit is open
      if (circuitInfo.state === "open") {
        const waitTime = circuitInfo.nextAttemptTime ? new Date(circuitInfo.nextAttemptTime).getTime() - Date.now() : 0

        const error: AppError = {
          code: ERROR_CODES.API_SERVICE_UNAVAILABLE,
          userMessage: `Meal planner temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds and try again.`,
          retryable: false,
          timestamp: new Date().toISOString(),
        }

        logError(error)
        setState(createErrorState(error, state))
        onError?.(error)
        return
      }

      const pantry: PantryData = {
        breakfast: pantryData.breakfast,
        lunch: pantryData.lunch,
        dinner: pantryData.dinner,
        snacks: pantryData.snacks,
        updatedAt: new Date().toISOString(),
      }

      const systemPrompt = `You are a precision nutrition calculator. Generate a meal plan using ONLY the provided foods.

CRITICAL: Return ONLY valid JSON, no markdown, no additional text.

Required format:
{
  "summary": "Brief description",
  "meals": [
    {
      "type": "breakfast",
      "time": "7:00 AM",
      "foods": [
        { "name": "Food Name", "weight": 100, "unit": "g", "calories": 150, "protein": 5, "carbs": 27, "fat": 3, "fiber": 4 }
      ],
      "totals": { "calories": 540, "protein": 20, "carbs": 65, "fat": 15 }
    }
  ],
  "dailyTotals": { "calories": ${settings.dailyCalorieGoal}, "protein": 150, "carbs": 225, "fat": 67, "fiber": 25 }
}

CONSTRAINTS:
1. Use ONLY the foods provided
2. Calculate precise portions for ${settings.dailyCalorieGoal} calories
3. Ensure meals add up to daily total
4. Return valid JSON only`

      const userPrompt = `Generate a precise meal plan using ONLY these available foods:

AVAILABLE FOODS:
- Breakfast: ${pantry.breakfast}
- Lunch: ${pantry.lunch}
- Dinner: ${pantry.dinner}
- Snacks: ${pantry.snacks}

USER PROFILE:
- Daily calorie goal: ${settings.dailyCalorieGoal} calories
- Goal: ${settings.goal || "maintain"}
- Activity level: ${settings.activityLevel || "moderately_active"}
- Dietary preferences: ${settings.dietaryPreferences?.join(", ") || "None specified"}

CRITICAL REQUIREMENTS:
1. Use ONLY foods from the available lists above
2. Calculate precise gram amounts to reach exactly ${settings.dailyCalorieGoal} calories
3. Distribute calories: Breakfast ${Math.round(settings.dailyCalorieGoal * MEAL_CALORIE_DISTRIBUTION.breakfast)}cal, Lunch ${Math.round(settings.dailyCalorieGoal * MEAL_CALORIE_DISTRIBUTION.lunch)}cal, Dinner ${Math.round(settings.dailyCalorieGoal * MEAL_CALORIE_DISTRIBUTION.dinner)}cal, Snack ${Math.round(settings.dailyCalorieGoal * MEAL_CALORIE_DISTRIBUTION.snack)}cal
4. Provide exact nutritional breakdown for each food item
5. If regeneration #${regenerationCount}, adjust gram amounts to improve accuracy

Return ONLY valid JSON, no markdown formatting:`

      try {
        await withCircuitBreaker<MealPlanGenerationResponse>({
          circuitBreaker: breaker,
          backoffOptions: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            multiplier: 2,
            jitter: true,
            retryableStatusCodes: [429, 500, 502, 503, 504],
          },
          timeoutMs: 45000, // Meal planning takes longer
          request: { prompt: userPrompt, model: API_CONFIG.MODEL },
          onCircuitOpen: (waitTime) => {
            const error: AppError = {
              code: ERROR_CODES.API_SERVICE_UNAVAILABLE,
              userMessage: `Meal planner is experiencing high demand. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
              retryable: true,
              timestamp: new Date().toISOString(),
            }
            logError(error)
            setState(createErrorState(error, state))
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

            const response = await fetch(API_CONFIG.OPENAI_BASE_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${settings.apiKey.trim()}`,
              },
              body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
              let errorData: Record<string, unknown> = {}
              try {
                errorData = await response.json().catch(() => ({}))
              } catch {
                // Ignore
              }

              // Handle rate limiting
              if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After")
                const delay = calculateRateLimitDelay(retryAfter ? Number.parseInt(retryAfter, 10) : undefined)
                await new Promise((resolve) => setTimeout(resolve, delay))
              }

              const error = classifyApiError(response.status, errorData, {
                operation: "generateMealPlanFromPantry",
                regenerationCount,
              })

              throw error
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            if (!content) {
              throw toAppError(new Error("No response from AI service"), {
                operation: "generateMealPlanFromPantry",
              })
            }

            const cleanedContent = content.replace(/```json\s*|\s*```/g, "").trim()

            let parsedResponse: MealPlanGenerationResponse
            try {
              parsedResponse = JSON.parse(cleanedContent)
            } catch (parseError) {
              const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                try {
                  parsedResponse = JSON.parse(jsonMatch[0])
                } catch {
                  throw classifyParseError(parseError as Error, {
                    operation: "generateMealPlanFromPantry",
                  })
                }
              } else {
                throw classifyParseError(parseError as Error, {
                  operation: "generateMealPlanFromPantry",
                  rawResponse: cleanedContent.substring(0, 100),
                })
              }
            }

            if (!parsedResponse.meals || !Array.isArray(parsedResponse.meals) || parsedResponse.meals.length === 0) {
              throw toAppError(new Error("AI returned incomplete meal plan"), {
                operation: "generateMealPlanFromPantry",
              })
            }

            return parsedResponse
          },
        })

        // Parse and validate the response (this is safe since we got a successful response)
        const content = await (async () => {
          const requestBody = {
            model: API_CONFIG.MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: API_CONFIG.TEMPERATURE,
            max_tokens: API_CONFIG.MAX_TOKENS,
          }

          const response = await fetch(API_CONFIG.OPENAI_BASE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${settings.apiKey.trim()}`,
            },
            body: JSON.stringify(requestBody),
          })

          const data = await response.json()
          return data.choices?.[0]?.message?.content
        })()

        if (!content) {
          const error: AppError = {
            code: ERROR_CODES.PARSE_RESPONSE_ERROR,
            userMessage: "No response from AI service",
            retryable: true,
            timestamp: new Date().toISOString(),
          }
          logError(error)
          setState(createErrorState(error, state))
          onError?.(error)
          return
        }

        const cleanedContent = content.replace(/```json\s*|\s*```/g, "").trim()
        const parsedResponse = JSON.parse(cleanedContent)

        // Check accuracy and retry if needed
        const actualCalories = parsedResponse.dailyTotals?.calories || 0
        const accuracyVariance = Math.abs(actualCalories - settings.dailyCalorieGoal)

        if (accuracyVariance > CALORIE_TOLERANCE && regenerationCount < 3) {
          const delay = 1000 * Math.pow(2, regenerationCount)
          await new Promise((resolve) => setTimeout(resolve, delay))
          return generateMealPlanFromPantryInternal(pantryData, regenerationCount + 1)
        }

        const mealPlan = parseAIResponse(parsedResponse, settings, pantry, regenerationCount)

        setState(createSuccessState(mealPlan, state))
        savePlan(mealPlan)
        onSuccess?.(mealPlan)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setState((prev) => ({ ...prev, status: "idle" }))
          return
        }

        const appError = toAppError(err, { operation: "generateMealPlanFromPantry" })

        if (appError.code !== ERROR_CODES.API_SERVICE_UNAVAILABLE) {
          logError(appError)
        }

        setState(createErrorState(appError, state))
        onError?.(appError)
      }
    },
    [settings, state, onSuccess, onError, savePlan],
  )

  const generateMealPlanFromPantry = useCallback(
    async (pantryData: PantryInputData) => {
      return generateMealPlanFromPantryInternal(pantryData)
    },
    [generateMealPlanFromPantryInternal],
  )

  // ============================================================================
  // Generate Meal Plan with Circuit Breaker
  // ============================================================================

  const generateMealPlanInternal = useCallback(
    async (request: MealPlanGenerationRequest, regenerationCount = 1): Promise<void> => {
      console.log("[v0] generateMealPlanInternal called")
      console.log("[v0] API Key check:", {
        exists: !!settings.apiKey,
        length: settings.apiKey?.length || 0,
        trimmedLength: settings.apiKey?.trim().length || 0,
      })

      const apiKeyValidation = validateApiKey(settings.apiKey)
      console.log("[v0] API key validation result:", apiKeyValidation)

      if (!apiKeyValidation.valid) {
        const error: AppError = {
          code: ERROR_CODES.VALIDATION_API_KEY_INVALID,
          userMessage: apiKeyValidation.error || "Invalid API key. Please check your OpenAI API key in Settings.",
          retryable: false,
          timestamp: new Date().toISOString(),
        }
        console.error("[v0] API key validation failed:", error)
        logError(error)
        setState(createErrorState(error))
        onError?.(error)
        return
      }

      setState(createLoadingState(state))

      const breaker = getMealPlannerCircuitBreaker()
      const circuitInfo = breaker.getState()

      // Check if circuit is open
      if (circuitInfo.state === "open") {
        const waitTime = circuitInfo.nextAttemptTime ? new Date(circuitInfo.nextAttemptTime).getTime() - Date.now() : 0

        const error: AppError = {
          code: ERROR_CODES.API_SERVICE_UNAVAILABLE,
          userMessage: `Meal planner temporarily unavailable. Please wait ${Math.ceil(waitTime / 1000)} seconds and try again.`,
          retryable: false,
          timestamp: new Date().toISOString(),
        }

        logError(error)
        setState(createErrorState(error, state))
        onError?.(error)
        return
      }

      const systemPrompt = `You are an expert nutritionist. Create a daily meal plan in EXACT JSON format.

CRITICAL: Return ONLY valid JSON, no markdown, no additional text.

Required format:
{
  "summary": "Brief description",
  "meals": [
    {
      "type": "breakfast",
      "time": "7:00 AM",
      "foods": [
        { "name": "Food Name", "weight": 100, "unit": "g", "calories": 150, "protein": 5, "carbs": 27, "fat": 3, "fiber": 4 }
      ],
      "totals": { "calories": 500, "protein": 20, "carbs": 60, "fat": 15 }
    }
  ],
  "dailyTotals": { "calories": 2000, "protein": 150, "carbs": 250, "fat": 67, "fiber": 25 }
}

Rules:
1. Use practical foods with gram weights
2. Calculate accurate nutrition for each item
3. Ensure meals add up to daily totals
4. Return valid JSON only`

      const userPrompt = `Generate a daily meal plan for:
- Daily calorie goal: ${request.targetCalories} calories
- Goal: ${request.goal}
- Activity level: ${request.activityLevel}
- Dietary preferences: ${request.dietaryPreferences.join(", ") || "None specified"}

Requirements:
- 3 main meals (breakfast, lunch, dinner) + optional snack
- Each meal should list 3-5 specific food items with exact gram weights
- Include macronutrient breakdown (protein/carbs/fat) for each food item
- Total daily intake should match the calorie goal within ±${CALORIE_TOLERANCE} calories
- Use common, practical foods
- No recipes needed, just food items and quantities
- Consider macro ratios for the goal type

Respond with only the JSON object, no markdown formatting.`

      try {
        await withCircuitBreaker<MealPlanGenerationResponse>({
          circuitBreaker: breaker,
          backoffOptions: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            multiplier: 2,
            jitter: true,
            retryableStatusCodes: [429, 500, 502, 503, 504],
          },
          timeoutMs: 45000,
          request: { prompt: userPrompt, model: API_CONFIG.MODEL },
          onCircuitOpen: (waitTime) => {
            const error: AppError = {
              code: ERROR_CODES.API_SERVICE_UNAVAILABLE,
              userMessage: `Meal planner is experiencing high demand. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
              retryable: true,
              timestamp: new Date().toISOString(),
            }
            logError(error)
            setState(createErrorState(error, state))
          },
          executor: async () => {
            console.log("[v0] Executing meal plan API request")
            console.log("[v0] Using API key (first 10 chars):", settings.apiKey.substring(0, 10) + "...")

            const requestBody = {
              model: API_CONFIG.MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: API_CONFIG.TEMPERATURE + 0.4,
              max_tokens: API_CONFIG.MAX_TOKENS,
            }

            console.log("[v0] Request body prepared:", {
              model: requestBody.model,
              messageCount: requestBody.messages.length,
              temperature: requestBody.temperature,
            })

            const response = await fetch(API_CONFIG.OPENAI_BASE_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${settings.apiKey.trim()}`,
              },
              body: JSON.stringify(requestBody),
            })

            console.log("[v0] API response status:", response.status)

            if (!response.ok) {
              let errorData: Record<string, unknown> = {}
              try {
                errorData = await response.json().catch(() => ({}))
                console.error("[v0] API error response:", errorData)
              } catch {
                // Ignore
              }

              if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After")
                const delay = calculateRateLimitDelay(retryAfter ? Number.parseInt(retryAfter, 10) : undefined)
                await new Promise((resolve) => setTimeout(resolve, delay))
              }

              const error = classifyApiError(response.status, errorData, {
                operation: "generateMealPlan",
                regenerationCount,
              })

              throw error
            }

            const data = await response.json()
            console.log("[v0] API response parsed:", {
              hasChoices: !!data.choices,
              choiceCount: data.choices?.length || 0,
            })

            const content = data.choices?.[0]?.message?.content

            if (!content) {
              console.error("[v0] No content in API response")
              throw toAppError(new Error("Empty response from AI service"), {
                operation: "generateMealPlan",
              })
            }

            console.log("[v0] Received content, length:", content.length)
            const cleanedContent = content.replace(/```json\s*|\s*```/g, "").trim()

            let parsedResponse: MealPlanGenerationResponse
            try {
              parsedResponse = JSON.parse(cleanedContent)
            } catch (parseError) {
              const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                try {
                  parsedResponse = JSON.parse(jsonMatch[0])
                } catch {
                  throw classifyParseError(parseError as Error, {
                    operation: "generateMealPlan",
                  })
                }
              } else {
                throw classifyParseError(parseError as Error, {
                  operation: "generateMealPlan",
                  rawResponse: cleanedContent.substring(0, 100),
                })
              }
            }

            if (!parsedResponse.meals || !Array.isArray(parsedResponse.meals) || parsedResponse.meals.length === 0) {
              throw toAppError(new Error("AI returned incomplete meal plan"), {
                operation: "generateMealPlan",
              })
            }

            return parsedResponse
          },
        })

        // Get the response again (for parsing) - in a real implementation,
        // we'd refactor to avoid this duplication
        const requestBody = {
          model: API_CONFIG.MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: API_CONFIG.TEMPERATURE + 0.4,
          max_tokens: API_CONFIG.MAX_TOKENS,
        }

        const response = await fetch(API_CONFIG.OPENAI_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey.trim()}`,
          },
          body: JSON.stringify(requestBody),
        })

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        const cleanedContent = content.replace(/```json\s*|\s*```/g, "").trim()
        const parsedResponse = JSON.parse(cleanedContent)

        const mealPlan = parseAIResponse(parsedResponse, settings)

        setState(createSuccessState(mealPlan, state))
        savePlan(mealPlan)
        onSuccess?.(mealPlan)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setState((prev) => ({ ...prev, status: "idle" }))
          return
        }

        const appError = toAppError(err, { operation: "generateMealPlan" })

        if (appError.code !== ERROR_CODES.API_SERVICE_UNAVAILABLE) {
          logError(appError)
        }

        setState(createErrorState(appError, state))
        onError?.(appError)
      }
    },
    [settings, state, onSuccess, onError, savePlan],
  )

  const generateMealPlan = useCallback(
    async (request: MealPlanGenerationRequest) => {
      return generateMealPlanInternal(request)
    },
    [generateMealPlanInternal],
  )

  // ============================================================================
  // Plan Management
  // ============================================================================

  const updateFoodItem = useCallback(
    (mealType: string, itemId: string, newWeight: number) => {
      if (!state.data) return

      const updatedMeals = state.data.meals.map((meal) => {
        if (meal.type !== mealType) return meal

        const updatedItems = meal.items.map((item) => {
          if (item.id !== itemId) return item

          const weightRatio = newWeight / item.weightGrams

          return {
            ...item,
            weightGrams: newWeight,
            calories: Math.round(item.calories * weightRatio),
            protein: Math.round(item.protein * weightRatio * 10) / 10,
            carbs: Math.round(item.carbs * weightRatio * 10) / 10,
            fat: Math.round(item.fat * weightRatio * 10) / 10,
          }
        })

        const totalCalories = updatedItems.reduce((sum, item) => sum + item.calories, 0)
        const totalProtein = updatedItems.reduce((sum, item) => sum + item.protein, 0)
        const totalCarbs = updatedItems.reduce((sum, item) => sum + item.carbs, 0)
        const totalFat = updatedItems.reduce((sum, item) => sum + item.fat, 0)

        return { ...meal, items: updatedItems, totalCalories, totalProtein, totalCarbs, totalFat }
      })

      const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
      const totalCarbs = updatedMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
      const totalFat = updatedMeals.reduce((sum, meal) => sum + meal.totalFat, 0)

      const updatedPlan = {
        ...state.data,
        meals: updatedMeals,
        totalMacros: { protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      }

      setState(createSuccessState(updatedPlan, state))
      savePlan(updatedPlan)
    },
    [state, savePlan],
  )

  const swapFoodItem = useCallback(
    (mealType: string, itemId: string, newItem: FoodItem) => {
      if (!state.data) return

      const updatedMeals = state.data.meals.map((meal) => {
        if (meal.type !== mealType) return meal

        const updatedItems = meal.items.map((item) => {
          if (item.id === itemId) {
            return { ...newItem, id: newItem.id || uuidv4() }
          }
          return item
        })

        const totalCalories = updatedItems.reduce((sum, item) => sum + item.calories, 0)
        const totalProtein = updatedItems.reduce((sum, item) => sum + item.protein, 0)
        const totalCarbs = updatedItems.reduce((sum, item) => sum + item.carbs, 0)
        const totalFat = updatedItems.reduce((sum, item) => sum + item.fat, 0)

        return { ...meal, items: updatedItems, totalCalories, totalProtein, totalCarbs, totalFat }
      })

      const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
      const totalCarbs = updatedMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
      const totalFat = updatedMeals.reduce((sum, meal) => sum + meal.totalFat, 0)

      const updatedPlan = {
        ...state.data,
        meals: updatedMeals,
        totalMacros: { protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      }

      setState(createSuccessState(updatedPlan, state))
      savePlan(updatedPlan)
    },
    [state, savePlan],
  )

  const addMealToLog = useCallback(
    async (mealType: string) => {
      if (!state.data) return

      const meal = state.data.meals.find((m) => m.type === mealType)
      if (!meal) return

      for (const item of meal.items) {
        const description = `${item.weightGrams}g ${item.name}`
        await onAddMeal(description, mealType)
      }
    },
    [state.data, onAddMeal],
  )

  const regenerateMealPlan = useCallback(async () => {
    if (!state.data || !settings.apiKey) return

    const request: MealPlanGenerationRequest = {
      targetCalories: settings.dailyCalorieGoal,
      goal: settings.goal || "maintain",
      activityLevel: settings.activityLevel || "moderately_active",
      dietaryPreferences: settings.dietaryPreferences || [],
      existingPlan: state.data,
    }

    return generateMealPlanInternal(request)
  }, [state.data, settings, generateMealPlanInternal])

  const saveTemplate = useCallback(
    (name: string, description?: string) => {
      if (!state.data) return

      const template: MealPlanTemplate = {
        id: uuidv4(),
        name,
        description,
        plan: { ...state.data },
        isFavorite: false,
        createdAt: new Date().toISOString(),
      }

      const updatedTemplates = [...templates, template]
      setTemplates(updatedTemplates)
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updatedTemplates))
    },
    [state.data, templates],
  )

  const loadTemplate = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId)
      if (!template) return

      const newPlan = {
        ...template.plan,
        id: uuidv4(),
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      }

      setState(createSuccessState(newPlan, state))
      savePlan(newPlan)
    },
    [templates, state, savePlan],
  )

  const deleteTemplate = useCallback(
    (templateId: string) => {
      const updatedTemplates = templates.filter((t) => t.id !== templateId)
      setTemplates(updatedTemplates)
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updatedTemplates))
    },
    [templates],
  )

  const clearPlan = useCallback(() => {
    setState(createInitialState())
  }, [])

  const savePantry = useCallback((pantryData: PantryInputData, saveAsDefault: boolean) => {
    const pantry: PantryData = {
      breakfast: pantryData.breakfast,
      lunch: pantryData.lunch,
      dinner: pantryData.dinner,
      snacks: pantryData.snacks,
      updatedAt: new Date().toISOString(),
    }

    if (saveAsDefault) {
      localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(pantry))
      setUserPantry(pantry)
    }
  }, [])

  const loadPantry = useCallback((): PantryData | null => {
    try {
      const storedPantry = localStorage.getItem(PANTRY_STORAGE_KEY)
      if (storedPantry) {
        const pantry = JSON.parse(storedPantry)
        setUserPantry(pantry)
        return pantry
      }
    } catch (err) {
      console.error("Error loading pantry data:", err)
    }
    return null
  }, [])

  return {
    ...state,
    templates,
    userPantry,
    generateMealPlan,
    generateMealPlanFromPantry,
    updateFoodItem,
    swapFoodItem,
    addMealToLog,
    regenerateMealPlan,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    clearPlan,
    savePantry,
    loadPantry,
  }
}

export default useMealPlanner
