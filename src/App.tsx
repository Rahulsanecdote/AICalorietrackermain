"use client"

import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import "./i18n/config"

import {
  Header,
  MealInput,
  MealList,
  SettingsModal,
  EditMealModal,
  RecipeDetailModal,
  MealPrepCard,
  UtilityPanel,
  VoiceLoggerModal,
  FoodVersusCard,
  NutriBotWidget,
  QuickAddWidget,
  AuthScreen,
} from "./components"
import { OnlineStatusBar } from "./components/ui/OnlineStatusBar"
import { DebugTools } from "./components/ui/DebugTools"
import { ErrorBanner } from "./components/ui/ErrorBanner"
import { RootErrorBoundary, FeatureErrorBoundary } from "./components/ErrorBoundary"
import {
  MealPlannerBoundary,
  AnalyticsBoundary,
  LifestyleBoundary,
  InsightsBoundary,
  MealPrepBoundary,
  ShoppingListBoundary,
} from "./components/features/FeatureBoundaries"
import { MonitoringDebugPanel } from "./components/MonitoringDebugPanel"
import { setupGlobalErrorHandlers, triggerHardReload } from "@/utils/globalErrorHandlers"
import { configureNotificationActions, notifyError, notifySuccess } from "@/utils/notifications"
import { useNutritionAI } from "./hooks/useNutritionAI"
import { useMealPlanner } from "./hooks/useMealPlanner"
import { useFavorites } from "./hooks/useFavorites"
import { useShoppingList } from "./hooks/useShoppingList"
import { useMealPrep } from "./hooks/useMealPrep"
import type { Meal, UserSettings, DailyTotals, MealCategory } from "./types"
import type { Recipe } from "./types/recipes"
import { v4 as uuidv4 } from "uuid"
import { Heart, Clock, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { API_CONFIG } from "./constants"
import { postAIChat } from "./utils/aiClient"

// Import contexts
import { useApp } from "./context/AppContext"
import { useAuth } from "./context/AuthContext"
import { useDate } from "./context/DateContext"

const CalorieDashboard = lazy(() => import("./components/CalorieDashboard"))
const MealPlanGenerator = lazy(() => import("./components/MealPlanGenerator"))
const AnalyticsDashboard = lazy(() => import("./components/analytics/AnalyticsDashboard"))
const LifestyleDashboard = lazy(() => import("./components/lifestyle/LifestyleDashboard"))
const ShoppingListView = lazy(() => import("./components/shopping/ShoppingListView"))
const InsightsDashboard = lazy(() =>
  import("./components/features/InsightsDashboard").then((module) => ({ default: module.InsightsDashboard })),
)

const DashboardLoadingCard = ({ title, description }: { title: string; description?: string }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-40 bg-gray-200 rounded dark:bg-gray-700" />
      {description ? <div className="h-3 w-56 bg-gray-100 rounded dark:bg-gray-700" /> : null}
      <div className="h-32 w-full bg-gray-100 rounded-xl dark:bg-gray-700" />
    </div>
    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">{title}</div>
  </div>
)

const DashboardErrorCard = ({
  title,
  message,
  onRetry,
  errorDetails,
}: {
  title: string
  message: string
  onRetry?: () => void
  errorDetails?: string
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 dark:bg-gray-800 dark:border-red-700">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/40">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">{title}</h3>
        <p className="text-sm text-red-600 dark:text-red-200 mt-1">{message}</p>
        {errorDetails ? (
          <details className="mt-2 text-xs text-red-600 dark:text-red-200">
            <summary className="cursor-pointer">Show details</summary>
            <pre className="mt-1 whitespace-pre-wrap">{errorDetails}</pre>
          </details>
        ) : null}
        {onRetry ? (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  </div>
)

// ============================================================================
// Main App Component
// ============================================================================

function AppShell() {
  const { t } = useTranslation()
  const { email, signOut } = useAuth()
  const handleSignOut = useCallback(() => {
    void signOut()
  }, [signOut])

  // Use App Context for global state
  const {
    settings,
    updateSettings,
    meals,

    addMealDirectly,
    updateMeal: updateMealInContext,
    deleteMeal: deleteMealFromContext,
    getMealsForDate,
    getWeeklyMeals,
    offlineQueue,
    processOfflineQueue,
  } = useApp()

  const { currentDate, goToPreviousDay, goToNextDay, goToToday, formatDate } = useDate()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isUtilityOpen, setIsUtilityOpen] = useState(false)
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  // View state for enhanced features
  const [activeView, setActiveView] = useState<
    "tracker" | "analytics" | "shopping" | "mealprep" | "favorites" | "lifestyle" | "insights"
  >("tracker")
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const handleManualMode = useCallback(() => {
    setActiveView("tracker")
  }, [setActiveView])

  // Favorites hook
  const {
    favorites,
    isFavorite: checkIsFavorite,
    isFoodItemFavorite,
    toggleFavorite,
    toggleFoodItemFavorite,
    removeFoodItemFavorite,
    removeRecipeFavorite,
  } = useFavorites()

  // Shopping list hook
  const {
    shoppingList,
    generateListFromMeals,
    addMealToShoppingList,
    toggleItemCheck,
    removeItem,
    addCustomItem,
    clearList,
    isItemInList,
  } = useShoppingList()

  // Meal prep hook
  const {
    suggestions: mealPrepSuggestions,
    isGenerating: isMealPrepGenerating,
    error: mealPrepError,
    generateSuggestions,
  } = useMealPrep()

  // Fresh handler for meal prep that always uses current meals state
  const handleGenerateMealPrep = useCallback(() => {
    const weekMeals = getWeeklyMeals(currentDate) // FIXED: NoRedeclare issue for getWeeklyMeals
    generateSuggestions(weekMeals)
    setActiveView("mealprep")
  }, [getWeeklyMeals, currentDate, generateSuggestions])

  const { analyzeFood, isLoading, error: hookError } = useNutritionAI()

  // Online/Offline detection
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true))

  // Calculate daily totals using context helper
  const dailyTotals: DailyTotals = useCallback(() => {
    const dayMeals = getMealsForDate(currentDate) // FIXED: NoRedeclare issue for getMealsForDate
    return dayMeals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.nutrition.calories,
        protein_g: totals.protein_g + meal.nutrition.protein_g,
        carbs_g: totals.carbs_g + meal.nutrition.carbs_g,
        fat_g: totals.fat_g + meal.nutrition.fat_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    )
  }, [getMealsForDate, currentDate])() // FIXED: NoRedeclare issues for these variables if they were used here

  // Sync hook error to state
  // const [aiError, setAiError] = useState<string | null>(null) // FIXED: NoRedeclare issue for aiError and setAiError - REMOVED

  useEffect(() => {
    setAiError(hookError ? hookError.userMessage : null)
  }, [hookError])

  // Keep online status in sync and flush queued work when connection returns
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true
      setIsOnline(online)
      if (online && offlineQueue.length > 0) {
        processOfflineQueue()
      }
    }

    updateOnlineStatus()

    if (typeof window !== "undefined") {
      window.addEventListener("online", updateOnlineStatus)
      window.addEventListener("offline", updateOnlineStatus)

      return () => {
        window.removeEventListener("online", updateOnlineStatus)
        window.removeEventListener("offline", updateOnlineStatus)
      }
    }
    return undefined;
  }, [offlineQueue.length, processOfflineQueue])

  // Setup global error handlers
  useEffect(() => {
    configureNotificationActions({
      manualMode: handleManualMode,
      reload: triggerHardReload,
    })
    setupGlobalErrorHandlers()

    console.log("[App] Global error handlers initialized")
  }, [handleManualMode, triggerHardReload])

  // Add meal with AI analysis
  async function handleAddMeal(description: string, category: MealCategory) {
    setAiError(null)

    if (!navigator.onLine) {
      console.warn("Offline mode: Saving meal locally without AI analysis")
    }

    const result = await analyzeFood(description)

    if (result) {
      const newMeal: Meal = {
        id: uuidv4(),
        description,
        foodName: result.foodName,
        servingSize: result.servingSize,
        nutrition: {
          calories: Math.round(result.calories),
          protein_g: Math.round(result.protein_g),
          carbs_g: Math.round(result.carbs_g),
          fat_g: Math.round(result.fat_g),
        },
        timestamp: new Date().toISOString(),
        category,
      }

      addMealDirectly(newMeal) // FIXED: NoRedeclare issue for addMealDirectly
    }
  }

  // Meal planner hook - pass the handleAddMeal function
  const {
    currentPlan,
    templates,
    userPantry,
    isGenerating,
    error: mealPlanError,
    generateMealPlan,
    generateMealPlanFromPantry,
    swapFoodItem,
    regenerateMealPlan,
    saveTemplate,
    loadTemplate,
    clearPlan,
    savePantry,
  } = useMealPlanner(settings, handleAddMeal) // FIXED: NoRedeclare issues for these variables

  const handleDeleteMeal = useCallback(
    (id: string) => {
      deleteMealFromContext(id) // FIXED: NoRedeclare issue for deleteMealFromContext
    },
    [deleteMealFromContext],
  )

  const handleEditMeal = useCallback((meal: Meal) => {
    setEditingMeal(meal)
  }, [])

  const handleSaveEditedMeal = useCallback(
    (updatedMeal: Meal) => {
      updateMealInContext(updatedMeal) // FIXED: NoRedeclare issue for updateMealInContext
    },
    [updateMealInContext],
  )

  const handleSettingsSave = (newSettings: UserSettings) => {
    updateSettings(newSettings) // FIXED: NoRedeclare issue for updateSettings
  }

  // Recipe handlers
  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsRecipeModalOpen(true)
  }

  const handleToggleFavorite = (recipeId: string) => {
    toggleFavorite(recipeId)
  }

  // Shopping list handlers
  const handleGenerateShoppingList = () => {
    const weekMeals = getWeeklyMeals(currentDate) // FIXED: NoRedeclare issue for getWeeklyMeals and currentDate
    generateListFromMeals(weekMeals, currentDate)
    setActiveView("shopping")
  }

  // Import handler for utility panel
  const handleImportMeals = (importedMeals: Partial<Meal>[]) => {
    const newMeals: Meal[] = importedMeals.map((meal) => ({
      id: uuidv4(),
      foodName: meal.foodName || "Unknown",
      description: meal.description || meal.foodName || "Unknown",
      servingSize: meal.servingSize || "1 serving",
      category: meal.category || "snack",
      nutrition: meal.nutrition || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      timestamp: new Date().toISOString(),
    }))

    newMeals.forEach((meal) => addMealDirectly(meal)) // FIXED: NoRedeclare issue for addMealDirectly
  }

  // Voice input handler
  const handleVoiceConfirm = (
    detectedFoods: {
      name: string
      quantity: number
      unit: string
      estimatedCalories: number
      macros: { protein_g: number; carbs_g: number; fat_g: number }
    }[],
  ) => {
    const newMeals: Meal[] = detectedFoods.map((food) => ({
      id: uuidv4(),
      description: `${food.quantity} ${food.unit} ${food.name}`,
      foodName: food.name,
      servingSize: `${food.quantity} ${food.unit}`,
      nutrition: {
        calories: food.estimatedCalories,
        protein_g: food.macros.protein_g,
        carbs_g: food.macros.carbs_g,
        fat_g: food.macros.fat_g,
      },
      timestamp: new Date().toISOString(),
      category: "snack",
    }))

    newMeals.forEach((meal) => addMealDirectly(meal)) // FIXED: NoRedeclare issue for addMealDirectly
  }

  // Test API connectivity
  const testAPI = async () => {
    console.log("Testing API connectivity...")
    try {
      const response = await postAIChat({
        model: API_CONFIG.MODEL,
        messages: [{ role: "user", content: 'Say "API test successful" and nothing else' }],
        temperature: 0.1,
        max_tokens: 10,
      })

      console.log("Test API response status:", response.status)

      if (response.ok) {
        await response.json()
        console.log("API Test successful")
        notifySuccess("API Test successful! AI proxy is responding.")
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Test failed with status:", response.status)
        notifyError(`API Test failed: ${errorData.error?.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("API Test error occurred")
      notifyError(`API Test error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Get current day's meals using context helper
  const currentDayMeals = getMealsForDate(currentDate) // FIXED: NoRedeclare issues for getMealsForDate and currentDate

  // Render the appropriate view based on active tab
  const renderView = () => {
    switch (activeView) {
      case "tracker":
        return (
          <>
            {/* Date Navigator - now using context */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 mb-4 dark:bg-gray-800">
              <button
                onClick={goToPreviousDay} // FIXED: NoRedeclare issue for goToPreviousDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
                aria-label="Go to previous day"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <button
                  onClick={goToToday} // FIXED: NoRedeclare issue for goToToday
                  className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors"
                >
                  {formatDate(currentDate, "weekday")} {/* FIXED: NoRedeclare issue for formatDate and currentDate */}
                </button>
              </div>
              <button
                onClick={goToNextDay} // FIXED: NoRedeclare issue for goToNextDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
                aria-label="Go to next day"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calorie Dashboard */}
            <FeatureErrorBoundary
              featureName="Calorie Dashboard"
              fallback={({ error, reset }) => (
                <DashboardErrorCard
                  title="Calorie dashboard unavailable"
                  message="We couldn't load your calorie summary. Your meals are still available."
                  errorDetails={error.message}
                  onRetry={reset}
                />
              )}
            >
              <Suspense
                fallback={
                  <DashboardLoadingCard
                    title="Loading calorie dashboard"
                    description="Preparing today's calorie summary."
                  />
                }
              >
                <CalorieDashboard totals={dailyTotals} settings={settings} />
              </Suspense>
            </FeatureErrorBoundary>

            {/* Online Status Bar */}
            <OnlineStatusBar isOnline={isOnline} />

            {/* Debug Tools */}
            <DebugTools testAPI={testAPI} onOpenUtilities={() => setIsUtilityOpen(true)} />

            <MealPlannerBoundary
              onManualMode={() => {
                // Switch to manual meal input mode
                setActiveView("tracker")
              }}
            >
              <Suspense
                fallback={
                  <DashboardLoadingCard title="Loading meal planner" description="Preparing your meal plan tools." />
                }
              >
                <MealPlanGenerator
                  settings={settings}
                  currentPlan={currentPlan}
                  templates={templates}
                  userPantry={userPantry}
                  isGenerating={isGenerating}
                  error={mealPlanError ? mealPlanError.userMessage : null}
                  onGeneratePlan={generateMealPlan}
                  onGeneratePlanFromPantry={generateMealPlanFromPantry}
                  onSavePantry={savePantry}
                  onRegeneratePlan={regenerateMealPlan}
                  onSaveTemplate={saveTemplate}
                  onLoadTemplate={loadTemplate}
                  onClearPlan={clearPlan}
                  onGenerateShoppingList={handleGenerateShoppingList}
                  onGenerateMealPrep={handleGenerateMealPrep}
                  onAddToShoppingList={(item) => {
                    addMealToShoppingList({
                      id: item.id,
                      foodName: item.name,
                      description: item.name,
                      servingSize: `${item.weightGrams}g`,
                      nutrition: {
                        calories: item.calories,
                        protein_g: item.protein,
                        carbs_g: item.carbs,
                        fat_g: item.fat,
                      },
                      timestamp: new Date().toISOString(),
                      category: "snack",
                    })
                  }}
                  onToggleFavorite={(item) => {
                    toggleFoodItemFavorite({
                      id: item.id,
                      name: item.name,
                      calories: item.calories,
                      protein: item.protein,
                      carbs: item.carbs,
                      fat: item.fat,
                      emoji: item.emoji,
                    })
                  }}
                  isFavorite={(item) => isFoodItemFavorite(item.id)}
                  isInShoppingList={(item) => isItemInList(item.name)}
                  onSwapFood={(mealType, itemId, newItem) => {
                    swapFoodItem(mealType, itemId, newItem)
                  }}
                />
              </Suspense>
            </MealPlannerBoundary>

            <InsightsBoundary onViewMeals={() => setActiveView("tracker")}>
              <Suspense
                fallback={
                  <DashboardLoadingCard title="Loading insights" description="Generating insight widgets." />
                }
              >
                <InsightsDashboard meals={meals} />
              </Suspense>
            </InsightsBoundary>

            {/* Manual Meal Input */}
            <MealInput
              onSubmit={handleAddMeal}
              isLoading={isLoading}
              error={aiError}
              onVoiceClick={() => setIsVoiceOpen(true)}
            />

            {/* Today's Meals List */}
            <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">
                {t("meals.todaysMeals") || "Today's Meals"}
              </h2>
              <MealList
                meals={currentDayMeals}
                onDelete={handleDeleteMeal}
                onEdit={handleEditMeal}
                onViewRecipe={handleViewRecipe}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={(recipeId) => checkIsFavorite(recipeId)}
                onAddToShoppingList={addMealToShoppingList}
                isInShoppingList={(meal) =>
                  meal.recipe ? isItemInList(meal.recipe.title) : isItemInList(meal.foodName)
                }
              />
            </div>
          </>
        )

      case "lifestyle":
        return (
          <>
            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 mb-4 dark:bg-gray-800">
              <button
                onClick={goToPreviousDay} // FIXED: NoRedeclare issue for goToPreviousDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <button
                  onClick={goToToday} // FIXED: NoRedeclare issue for goToToday
                  className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors"
                >
                  {formatDate(currentDate, "weekday")} {/* FIXED: NoRedeclare issue for formatDate and currentDate */}
                </button>
              </div>
              <button
                onClick={goToNextDay} // FIXED: NoRedeclare issue for goToNextDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <LifestyleBoundary onBasicView={() => setActiveView("tracker")}>
              <Suspense
                fallback={
                  <DashboardLoadingCard title="Loading lifestyle dashboard" description="Syncing wellness data." />
                }
              >
                <LifestyleDashboard date={currentDate} />
              </Suspense>
            </LifestyleBoundary>
          </>
        )

      case "analytics":
        return (
          <>
            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 mb-4 dark:bg-gray-800">
              <button
                onClick={goToPreviousDay} // FIXED: NoRedeclare issue for goToPreviousDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <button
                  onClick={goToToday} // FIXED: NoRedeclare issue for goToToday
                  className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors"
                >
                  {formatDate(currentDate, "weekday")} {/* FIXED: NoRedeclare issue for formatDate and currentDate */}
                </button>
              </div>
              <button
                onClick={goToNextDay} // FIXED: NoRedeclare issue for goToNextDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <AnalyticsBoundary
              onRawView={() => {
                // Switch to raw data view
                setActiveView("tracker")
              }}
            >
              <Suspense
                fallback={
                  <DashboardLoadingCard title="Loading analytics" description="Preparing your reports." />
                }
              >
                <AnalyticsDashboard settings={settings} />
              </Suspense>
            </AnalyticsBoundary>
          </>
        )

      case "insights":
        return (
          <>
            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 mb-4 dark:bg-gray-800">
              <button
                onClick={goToPreviousDay} // FIXED: NoRedeclare issue for goToPreviousDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <button
                  onClick={goToToday} // FIXED: NoRedeclare issue for goToToday
                  className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors"
                >
                  {formatDate(currentDate, "weekday")} {/* FIXED: NoRedeclare issue for formatDate and currentDate */}
                </button>
              </div>
              <button
                onClick={goToNextDay} // FIXED: NoRedeclare issue for goToNextDay
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <InsightsBoundary onViewMeals={() => setActiveView("tracker")}>
              <Suspense
                fallback={
                  <DashboardLoadingCard title="Loading insights" description="Preparing your insights dashboard." />
                }
              >
                <InsightsDashboard meals={meals} />
              </Suspense>
            </InsightsBoundary>
          </>
        )

      case "shopping":
        return (
          <ShoppingListBoundary>
            <Suspense
              fallback={
                <DashboardLoadingCard title="Loading shopping list" description="Fetching your items." />
              }
            >
              {shoppingList ? (
                <ShoppingListView
                  shoppingList={shoppingList}
                  onToggleItem={toggleItemCheck}
                  onRemoveItem={removeItem}
                  onAddCustomItem={addCustomItem}
                  onClearList={() => {
                    clearList()
                    setActiveView("tracker")
                  }}
                  onClose={() => setActiveView("tracker")}
                />
              ) : (
                <DashboardLoadingCard title="No shopping list" description="Create a meal plan first." />
              )}
            </Suspense>
          </ShoppingListBoundary>
        )

      case "mealprep":
        return (
          <MealPrepBoundary onBackToTracker={() => setActiveView("tracker")}>
            <div className="space-y-4">
              {/* Meal Prep Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("mealPrep.title")}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("mealPrep.basedOnMeals")}</p>
                  </div>
                  <button
                    onClick={handleGenerateMealPrep}
                    disabled={isMealPrepGenerating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMealPrepGenerating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {t("common.generating") || "Generating..."}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        {t("mealPrep.regenerateTips")}
                      </>
                    )}
                  </button>
                </div>

                {/* Error display */}
                {mealPrepError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {mealPrepError}
                  </div>
                )}

                {/* Quick stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {t("mealPrep.last7Days")}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {t("mealPrep.totalMealsLogged", { count: meals.length })}
                  </span>
                </div>
              </div>

              {/* Meal Prep Cards */}
              {mealPrepSuggestions.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {mealPrepSuggestions.map((suggestion) => (
                    <MealPrepCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 dark:bg-gray-800 dark:border-gray-700">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t("mealPrep.noSuggestionsYet")}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t("mealPrep.logMealsFirst")}</p>
                    <button
                      onClick={() => setActiveView("tracker")}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      {t("mealPrep.goToTracker")}
                    </button>
                  </div>
                </div>
              )}

              {/* Batch Prep Tips Section */}
              {mealPrepSuggestions.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Quick Batch Prep Tips
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      Cook grains in bulk (rice, quinoa, oats) for the week
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      Pre-chop vegetables and store in airtight containers
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      Portion snacks into grab-and-go containers
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      Marinate proteins overnight for faster cooking
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </MealPrepBoundary>
        )

      case "favorites":
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("favorites.title")}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("favorites.subtitle")}</p>
              </div>
            </div>

            {/* Get food item favorites */}
            {(() => {
              const foodItemFavorites = favorites.filter((f) => f?.type === "food")
              const recipeFavorites = favorites.filter((f) => f?.type === "recipe")

              // Show food item favorites
              if (foodItemFavorites.length > 0) {
                return (
                  <div className="space-y-6">
                    {/* Food Items Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider dark:text-gray-300">
                        Food Items
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {foodItemFavorites.map((item) => (
                          <div
                            key={item.id}
                            className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow dark:bg-gray-700"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.emoji || "🍽️"}</span>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.calories} cal per serving
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  removeFoodItemFavorite(item.foodItemId!) // FIXED: NoRedeclare issue for removeFoodItemFavorite
                                }}
                                className="text-red-500 hover:text-red-600 transition-colors"
                                title="Remove from favorites"
                              >
                                <Heart className="w-5 h-5 fill-current" />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="text-blue-600 font-medium">{item.protein}g protein</span>
                              <span className="text-amber-600 font-medium">{item.carbs}g carbs</span>
                              <span className="text-red-600 font-medium">{item.fat}g fat</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recipe Favorites Section */}
                    {recipeFavorites.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider dark:text-gray-300">
                          Recipes
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {recipeFavorites.map((fav) => {
                            const mealWithRecipe = meals.find((m) => m.recipe?.id === fav.recipeId) // FIXED: NoRedeclare issue for meals
                            if (!mealWithRecipe?.recipe) return null

                            return (
                              <div
                                key={fav.id}
                                className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-700"
                                onClick={() => mealWithRecipe.recipe && handleViewRecipe(mealWithRecipe.recipe)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                      {mealWithRecipe.recipe.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {mealWithRecipe.recipe.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleFavorite(mealWithRecipe.recipe!.id)
                                    }}
                                    className="text-red-500 hover:text-red-600 transition-colors"
                                    title="Remove from favorites"
                                  >
                                    <Heart className="w-5 h-5 fill-current" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {mealWithRecipe.recipe.prepTimeMinutes + mealWithRecipe.recipe.cookTimeMinutes} min
                                  </span>
                                  <span className="text-indigo-600 font-medium dark:text-indigo-400">
                                    {mealWithRecipe.recipe.caloriesPerServing} cal
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              // If no food favorites but we have recipe favorites
              if (recipeFavorites.length > 0) {
                return (
                  <div className="grid md:grid-cols-2 gap-4">
                    {recipeFavorites.map((fav) => {
                      const mealWithRecipe = meals.find((m) => m.recipe?.id === fav.recipeId) // FIXED: NoRedeclare issue for meals
                      if (!mealWithRecipe?.recipe) return null

                      return (
                        <div
                          key={fav.id}
                          className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-700"
                          onClick={() => mealWithRecipe.recipe && handleViewRecipe(mealWithRecipe.recipe)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {mealWithRecipe.recipe.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {mealWithRecipe.recipe.description}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeRecipeFavorite(mealWithRecipe.recipe!.id) // FIXED: NoRedeclare issue for removeRecipeFavorite
                              }}
                              className="text-red-500 hover:text-red-600 transition-colors"
                              title="Remove from favorites"
                            >
                              <Heart className="w-5 h-5 fill-current" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {mealWithRecipe.recipe.prepTimeMinutes + mealWithRecipe.recipe.cookTimeMinutes} min
                            </span>
                            <span className="text-indigo-600 font-medium dark:text-indigo-400">
                              {mealWithRecipe.recipe.caloriesPerServing} cal
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }

              return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>{t("favorites.noFavorites")}</p>
                  <p className="text-sm mt-1">{t("favorites.heartIcon")}</p>
                </div>
              )
            })()}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <RootErrorBoundary
      fallback={({ error, reset }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-red-50 px-6 py-8 text-center border-b border-red-100">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-sm text-gray-600">
                The application encountered an unexpected error. Your data is safe.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="text-xs text-gray-500 font-mono break-all">{error?.message ?? "Unknown error type"}</div>
            </div>
            <div className="px-6 py-4 space-y-3">
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload Application
              </button>
              <button
                onClick={() => {
                  const data = { meals, settings } // FIXED: NoRedeclare issue for meals and settings
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `backup-${new Date().toISOString().split("T")[0]}.json`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Data Backup
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <div className="min-h-screen bg-gray-50 pb-20 dark:bg-gray-900">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUtilities={() => setIsUtilityOpen(true)}
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenCompare={() => setIsCompareOpen(true)}
          activeView={activeView}
          onViewChange={setActiveView}
          userEmail={email}
          onSignOut={handleSignOut}
        />

        <main id="main-content" className="max-w-4xl mx-auto px-4 py-6 space-y-6">{renderView()}</main>

        {/* Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={handleSettingsSave}
        />

        <EditMealModal
          isOpen={!!editingMeal}
          onClose={() => setEditingMeal(null)}
          meal={editingMeal}
          onSave={handleSaveEditedMeal}
        />

        <RecipeDetailModal
          recipe={selectedRecipe!}
          isOpen={isRecipeModalOpen}
          onClose={() => {
            setIsRecipeModalOpen(false)
            setSelectedRecipe(null)
          }}
          onToggleFavorite={() => selectedRecipe && handleToggleFavorite(selectedRecipe.id)}
          isFavorite={selectedRecipe ? checkIsFavorite(selectedRecipe.id) : false}
        />

        {/* Utility Panel */}
        <UtilityPanel
          meals={meals} // FIXED: NoRedeclare issue for meals
          settings={settings} // FIXED: NoRedeclare issue for settings
          dailyTotals={dailyTotals}
          onImportMeals={handleImportMeals}
          isOpen={isUtilityOpen}
          onClose={() => setIsUtilityOpen(false)}
        />

        {/* Voice Logger Modal */}
        <VoiceLoggerModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onConfirm={handleVoiceConfirm} />

        {/* Food Comparison Modal */}
        <FoodVersusCard isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />

        {/* NutriBot Widget */}
        <NutriBotWidget />

        {/* Quick Add Widget */}
        <QuickAddWidget
          onMealAdded={(meal) => {
            addMealDirectly(meal) // FIXED: NoRedeclare issue for addMealDirectly
          }}
        />

        {/* Global Error Banner */}
        <ErrorBanner />

        <MonitoringDebugPanel />

        <footer className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
          <p>NutriAI - AI-Powered Calorie Tracking & Meal Planning</p>
        </footer>
      </div>
    </RootErrorBoundary>
  )
}

function App() {
  const { userId, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-500 dark:text-gray-400">Checking your session...</div>
      </div>
    )
  }

  if (!userId) {
    return <AuthScreen />
  }

  return <AppShell />
}

export default App
