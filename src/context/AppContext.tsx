"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react"
import type { UserSettings, Meal, DailyTotals, MealCategory } from "../types"
import { v4 as uuidv4 } from "uuid"
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "../constants"
import { validateAndMigrateMeals, validateAndMigrateSettings } from "../utils/dataMigration"
import { validateMeal, validateUserSettings } from "../utils/validation"
import { checkStorageIntegrity, attemptRecovery, isStorageAvailable, downloadDataExport } from "../utils/errorRecovery"
import { normalizeSettings } from "../utils/settingsNormalization"

// Context type definitions with error handling extensions
interface QueuedRequest {
  id: string
  type: "meal_plan" | "nutrition_analysis" | "recipe_generation"
  payload: unknown
  timestamp: string
  retryCount: number
}

interface StorageState {
  isReadOnly: boolean
  corruptionDetected: boolean
  corruptionError: string | null
  recoveryAttempted: boolean
}

interface AppContextType {
  // User Settings
  settings: UserSettings
  updateSettings: (settings: Partial<UserSettings>) => void

  // Meals
  meals: Meal[]
  addMeal: (description: string, category: MealCategory) => Promise<void>
  addMealDirectly: (meal: Meal) => void
  updateMeal: (meal: Meal) => void
  deleteMeal: (id: string) => void

  // Daily totals
  dailyTotals: DailyTotals

  // Helper functions
  getMealsForDate: (date: string) => Meal[]
  getWeeklyMeals: (endDate: string) => Meal[]

  // Initialization status
  isInitialized: boolean
  initializationError: string | null

  // Storage state (for graceful degradation)
  storageState: StorageState
  enterReadOnlyMode: (reason: string) => void
  exitReadOnlyMode: () => void

  // Offline queue for AI requests
  offlineQueue: QueuedRequest[]
  addToOfflineQueue: (request: Omit<QueuedRequest, "id" | "timestamp" | "retryCount">) => void
  removeFromOfflineQueue: (id: string) => void
  clearOfflineQueue: () => void
  processOfflineQueue: () => Promise<void>

  // Data export
  exportUserData: () => void
}

const initialContext: AppContextType = {
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  meals: [],
  addMeal: async () => {},
  addMealDirectly: () => {},
  updateMeal: () => {},
  deleteMeal: () => {},
  dailyTotals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  getMealsForDate: () => [],
  getWeeklyMeals: () => [],
  isInitialized: false,
  initializationError: null,
  storageState: {
    isReadOnly: false,
    corruptionDetected: false,
    corruptionError: null,
    recoveryAttempted: false,
  },
  enterReadOnlyMode: () => {},
  exitReadOnlyMode: () => {},
  offlineQueue: [],
  addToOfflineQueue: () => {},
  removeFromOfflineQueue: () => {},
  clearOfflineQueue: () => {},
  processOfflineQueue: async () => {},
  exportUserData: () => {},
}

const AppContext = createContext<AppContextType>(initialContext)

const OFFLINE_QUEUE_KEY = "nutriai_offline_queue"

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(normalizeSettings(DEFAULT_SETTINGS))
  const [meals, setMeals] = useState<Meal[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  const [storageState, setStorageState] = useState<StorageState>({
    isReadOnly: false,
    corruptionDetected: false,
    corruptionError: null,
    recoveryAttempted: false,
  })

  const [offlineQueue, setOfflineQueue] = useState<QueuedRequest[]>([])

  const safePersistData = useCallback(
    <T,>(key: string, data: T): boolean => {
      if (storageState.isReadOnly) {
        console.warn(`Cannot persist ${key}: storage is in read-only mode`)
        return false
      }

      try {
        localStorage.setItem(key, JSON.stringify(data))
        return true
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error)
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          setStorageState((prev) => ({
            ...prev,
            isReadOnly: true,
            corruptionError: "Storage quota exceeded. App is now in read-only mode.",
          }))
        }
        return false
      }
    },
    [storageState.isReadOnly],
  )

  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY)
      if (storedQueue) {
        const parsed = JSON.parse(storedQueue)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        const validRequests = parsed.filter((req: QueuedRequest) => new Date(req.timestamp).getTime() > oneDayAgo)
        setOfflineQueue(validRequests)
      }
    } catch (error) {
      console.error("Error loading offline queue:", error)
    }
  }, [])

  useEffect(() => {
    try {
      if (storageState.isReadOnly) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY)
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue))
      }
    } catch (error) {
      console.error("Error saving offline queue:", error)
    }
  }, [offlineQueue, storageState.isReadOnly])

  useEffect(() => {
    let settingsLoaded = false
    let mealsLoaded = false

    if (!isStorageAvailable()) {
      setStorageState((prev) => ({
        ...prev,
        isReadOnly: true,
        corruptionDetected: true,
        corruptionError: "Storage is not available. App is in read-only mode.",
      }))
      setInitializationError("Storage unavailable")
      setIsInitialized(true)
      return
    }

    const integrity = checkStorageIntegrity()
    if (integrity.isCorrupted) {
      console.warn("Storage corruption detected:", integrity.corruptedKeys)

      const recovery = attemptRecovery()
      if (recovery.success) {
        console.log("Recovery successful, recovered keys:", Object.keys(recovery.recoveredData || {}))
      }

      setStorageState((prev) => ({
        ...prev,
        corruptionDetected: true,
        corruptionError: `Storage corruption detected in ${integrity.corruptedKeys.length} item(s). App is in read-only mode.`,
        recoveryAttempted: true,
        isReadOnly: true,
      }))
    }

    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings)
          const { settings: migratedSettings, migrated } = validateAndMigrateSettings(parsedSettings)

          const validation = validateUserSettings(migratedSettings)
          if (validation.valid && validation.data) {
            const normalized = normalizeSettings(validation.data)
            setSettings(normalized)
            settingsLoaded = true

            if (migrated) {
              console.log("Settings migrated and normalized to current version")
              safePersistData(STORAGE_KEYS.SETTINGS, normalized)
            }
          } else {
            console.warn("Invalid settings format, using defaults:", validation.error)
            setSettings(normalizeSettings(DEFAULT_SETTINGS))
            if (!storageState.isReadOnly) {
              setInitializationError(validation.error ?? "Invalid settings format")
            }
            settingsLoaded = true
          }
        } catch (error) {
          console.error("Error parsing settings:", error)
          setSettings(normalizeSettings(DEFAULT_SETTINGS))
          if (!storageState.isReadOnly) {
            setInitializationError("Failed to parse settings")
          }
          settingsLoaded = true
        }
      } else {
        setSettings(normalizeSettings(DEFAULT_SETTINGS))
        settingsLoaded = true
      }

      const storedMeals = localStorage.getItem(STORAGE_KEYS.MEALS)
      if (storedMeals) {
        try {
          const parsedMeals = JSON.parse(storedMeals)
          const { meals: migratedMeals, migrated } = validateAndMigrateMeals(parsedMeals)

          const validMeals: Meal[] = []
          const invalidCount = migratedMeals.reduce((count, meal) => {
            const validation = validateMeal(meal)
            if (validation.valid && validation.data) {
              validMeals.push(validation.data)
            } else {
              return count + 1
            }
            return count
          }, 0)

          setMeals(validMeals)
          mealsLoaded = true

          if (migrated || invalidCount > 0) {
            console.log(
              `Meals ${migrated ? "migrated" : ""}${
                invalidCount > 0 ? `, ${invalidCount} invalid entries removed` : ""
              }`,
            )
            safePersistData(STORAGE_KEYS.MEALS, validMeals)
          }
        } catch (error) {
          console.error("Error parsing meals:", error)
          if (!storageState.isReadOnly) {
            setInitializationError("Failed to parse meals")
          }
          mealsLoaded = true
        }
      } else {
        mealsLoaded = true
      }
    } catch (error) {
      console.error("Error initializing from localStorage:", error)
      if (!storageState.isReadOnly) {
        setInitializationError("Storage initialization failed")
      }
    } finally {
      if (settingsLoaded && mealsLoaded) {
        setIsInitialized(true)
      }
    }
  }, [safePersistData, storageState.isReadOnly])

  const dailyTotals = useMemo((): DailyTotals => {
    const today = new Date().toISOString().split("T")[0]
    const dayMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.timestamp).toISOString().split("T")[0]
      return mealDate === today
    })

    return dayMeals.reduce<DailyTotals>(
      (totals, meal) => ({
        calories: totals.calories + meal.nutrition.calories,
        protein_g: totals.protein_g + meal.nutrition.protein_g,
        carbs_g: totals.carbs_g + meal.nutrition.carbs_g,
        fat_g: totals.fat_g + meal.nutrition.fat_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    )
  }, [meals])

  const updateSettings = useCallback(
    (newSettings: Partial<UserSettings>) => {
      if (storageState.isReadOnly) {
        console.warn("Cannot update settings: storage is in read-only mode")
        return
      }

      setSettings((prev) => {
        const merged = { ...prev, ...newSettings }
        const normalized = normalizeSettings(merged)
        safePersistData(STORAGE_KEYS.SETTINGS, normalized)
        return normalized
      })
    },
    [safePersistData, storageState.isReadOnly],
  )

  const addMeal = useCallback(
    async (_description: string, _category: MealCategory) => {
      const newMeal: Meal = {
        id: uuidv4(),
        description: _description,
        foodName: _description,
        servingSize: "1 serving",
        nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        timestamp: new Date().toISOString(),
        category: _category,
      }

      setMeals((prev) => {
        const updated = [...prev, newMeal]
        safePersistData(STORAGE_KEYS.MEALS, updated)
        return updated
      })
    },
    [safePersistData],
  )

  const addMealDirectly = useCallback(
    (meal: Meal) => {
      if (storageState.isReadOnly) {
        console.warn("Cannot add meal: storage is in read-only mode")
        return
      }

      const validation = validateMeal(meal)
      if (!validation.valid || !validation.data) {
        console.error("Invalid meal data:", validation.error)
        return
      }

      setMeals((prev) => {
        const updated = [...prev, validation.data!]
        safePersistData(STORAGE_KEYS.MEALS, updated)
        return updated
      })
    },
    [safePersistData, storageState.isReadOnly],
  )

  const updateMeal = useCallback(
    (meal: Meal) => {
      if (storageState.isReadOnly) {
        console.warn("Cannot update meal: storage is in read-only mode")
        return
      }

      setMeals((prev) => {
        const updated = prev.map((m) => (m.id === meal.id ? meal : m))
        safePersistData(STORAGE_KEYS.MEALS, updated)
        return updated
      })
    },
    [safePersistData, storageState.isReadOnly],
  )

  const deleteMeal = useCallback(
    (id: string) => {
      if (storageState.isReadOnly) {
        console.warn("Cannot delete meal: storage is in read-only mode")
        return
      }

      setMeals((prev) => {
        const updated = prev.filter((m) => m.id !== id)
        safePersistData(STORAGE_KEYS.MEALS, updated)
        return updated
      })
    },
    [safePersistData, storageState.isReadOnly],
  )

  const getMealsForDate = useCallback(
    (date: string) => {
      return meals
        .filter((meal) => {
          const mealDate = new Date(meal.timestamp).toISOString().split("T")[0]
          return mealDate === date
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    },
    [meals],
  )

  const getWeeklyMeals = useCallback(
    (endDate: string) => {
      const end = new Date(endDate)
      const start = new Date(end)
      start.setDate(start.getDate() - 7)

      return meals.filter((meal) => {
        const mealDate = new Date(meal.timestamp)
        return mealDate >= start && mealDate <= end
      })
    },
    [meals],
  )

  const enterReadOnlyMode = useCallback((reason: string) => {
    setStorageState((prev) => ({
      ...prev,
      isReadOnly: true,
      corruptionError: reason,
    }))
    console.warn("Entered read-only mode:", reason)
  }, [])

  const exitReadOnlyMode = useCallback(() => {
    try {
      const testKey = "__read_only_test__"
      localStorage.setItem(testKey, "test")
      localStorage.removeItem(testKey)

      setStorageState((prev) => ({
        ...prev,
        isReadOnly: false,
        corruptionError: null,
      }))
      console.log("Exited read-only mode")
    } catch (error) {
      console.error("Cannot exit read-only mode: storage still unavailable")
    }
  }, [])

  const addToOfflineQueue = useCallback((request: Omit<QueuedRequest, "id" | "timestamp" | "retryCount">) => {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    }

    setOfflineQueue((prev) => [...prev, queuedRequest])
    console.log("Added to offline queue:", queuedRequest.id)
  }, [])

  const removeFromOfflineQueue = useCallback((id: string) => {
    setOfflineQueue((prev) => prev.filter((req) => req.id !== id))
  }, [])

  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([])
    console.log("Offline queue cleared")
  }, [])

  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0 || storageState.isReadOnly) return

    console.log(`Processing ${offlineQueue.length} queued requests`)

    const queueSnapshot = [...offlineQueue]
    const MAX_RETRIES = 3

    for (const request of queueSnapshot) {
      try {
        // TODO: Replace with real request replay once backend endpoints are wired up
        await new Promise((resolve) => setTimeout(resolve, 500))
        setOfflineQueue((prev) => prev.filter((queued) => queued.id !== request.id))
      } catch (error) {
        console.error(`Failed to process queued request ${request.id}:`, error)
        setOfflineQueue((prev) =>
          prev
            .map((queued) => (queued.id === request.id ? { ...queued, retryCount: queued.retryCount + 1 } : queued))
            .filter((queued) => queued.retryCount < MAX_RETRIES),
        )
      }
    }
  }, [offlineQueue, storageState.isReadOnly])

  const exportUserData = useCallback(() => {
    downloadDataExport()
  }, [])

  const value: AppContextType = useMemo(
    () => ({
      settings,
      updateSettings,
      meals,
      addMeal,
      addMealDirectly,
      updateMeal,
      deleteMeal,
      dailyTotals,
      getMealsForDate,
      getWeeklyMeals,
      isInitialized,
      initializationError,
      storageState,
      enterReadOnlyMode,
      exitReadOnlyMode,
      offlineQueue,
      addToOfflineQueue,
      removeFromOfflineQueue,
      clearOfflineQueue,
      processOfflineQueue,
      exportUserData,
    }),
    [
      settings,
      updateSettings,
      meals,
      addMeal,
      addMealDirectly,
      updateMeal,
      deleteMeal,
      dailyTotals,
      getMealsForDate,
      getWeeklyMeals,
      isInitialized,
      initializationError,
      storageState,
      enterReadOnlyMode,
      exitReadOnlyMode,
      offlineQueue,
      addToOfflineQueue,
      removeFromOfflineQueue,
      clearOfflineQueue,
      processOfflineQueue,
      exportUserData,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

export default AppContext
