"use client"

import React, { useState, Suspense, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { v4 as uuidv4 } from "uuid"
import { createTimestampFromLocal } from "./utils/dateHelpers"
import { useApp } from "./context/AppContext"
import { useDate } from "./context/DateContext"
import { useAuth } from "./context/AuthContext"
import { useNutritionAI } from "./hooks/useNutritionAI"
import { useShoppingList } from "./hooks/useShoppingList"
import { useFavorites } from "./hooks/useFavorites"
import { Meal, MealCategory } from "./types"
import { API_CONFIG } from "./constants"
import { postAIChat } from "./utils/aiClient"

import {
  DateNavigator,
  EditMealModal,
  Header,
  MealCard,
  MealInput,
  MealList,
  SettingsModal,
  AuthScreen,
  UtilityPanel,
  QuickAddWidget,
  ThemeToggle,
} from "./components"

const LifestyleDashboard = React.lazy(() => import("./components/lifestyle/LifestyleDashboard"))
const AnalyticsDashboard = React.lazy(() => import("./components/analytics/AnalyticsDashboard"))
const CalorieDashboard = React.lazy(() => import("./components/CalorieDashboard"))
const MealPlanGenerator = React.lazy(() => import("./components/MealPlanGenerator"))
const ShoppingListView = React.lazy(() => import("./components/shopping/ShoppingListView"))
const InsightsDashboard = React.lazy(() => import("./components/features/InsightsDashboard"))
import { ErrorBanner } from "./components/ui/ErrorBanner"
import { MonitoringDebugPanel } from "./components/MonitoringDebugPanel"
import { RootErrorBoundary } from "./components/ErrorBoundary"

// Simple loading component
function DashboardLoadingCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border animate-pulse">
      <div className="h-6 w-1/3 bg-muted rounded mb-2"></div>
      <div className="h-4 w-2/3 bg-muted rounded"></div>
      <div className="sr-only">
        {title} - {description}
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  const { t } = useTranslation()
  const {
    meals,
    addMealDirectly,
    getMealsForDate,
    dailyTotals,
    settings,
  } = useApp()
  const { currentDate, goToPreviousDay, goToNextDay, goToToday } = useDate()
  const { analyzeFood, setAiError } = useNutritionAI()
  const [activeView, setActiveView] = useState<"tracker" | "lifestyle" | "analytics">("tracker")

  const { addMealToShoppingList, isItemInList } = useShoppingList()
  const { isFavorite: checkIsFavorite, toggleFavorite: handleToggleFavorite } = useFavorites()

  // Add meal with AI analysis
  const handleAddMeal = async (description: string, category: MealCategory) => {
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
        // FIXED: Use selected date instead of "now" to support logging for past/future dates
        timestamp: createTimestampFromLocal(currentDate),
        category,
      }

      addMealDirectly(newMeal)
    }
  }

  // ...

  // Import handler for utility panel
  const handleImportMeals = (importedMeals: Partial<Meal>[]) => {
    const newMeals: Meal[] = importedMeals.map((meal) => ({
      id: uuidv4(),
      foodName: meal.foodName || "Unknown",
      description: meal.description || meal.foodName || "Unknown",
      servingSize: meal.servingSize || "1 serving",
      category: meal.category || "snack",
      nutrition: meal.nutrition || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      // FIXED: Use selected date
      timestamp: createTimestampFromLocal(currentDate),
    }))

    newMeals.forEach((meal) => addMealDirectly(meal))
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
      // FIXED: Use selected date
      timestamp: createTimestampFromLocal(currentDate),
      category: "snack",
    }))

    newMeals.forEach((meal) => addMealDirectly(meal))
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
            <div className="flex items-center justify-between bg-card rounded-xl p-3 mb-4 border border-border">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-accent rounded-lg"
                aria-label="Go to previous day"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <button
                  onClick={goToToday}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {formatDate(currentDate, "weekday")}
                </button>
              </div>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-accent rounded-lg"
                aria-label="Go to next day"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground"
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
            <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
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
            <div className="flex items-center justify-between bg-card rounded-xl p-3 mb-4 dark:bg-card">
              <button
                onClick={goToPreviousDay} // FIXED: NoRedeclare issue for goToPreviousDay
                className="p-2 hover:bg-accent rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground dark:text-muted-foreground"
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
                  className="font-semibold text-foreground dark:text-white hover:text-primary transition-colors"
                >
                  {formatDate(currentDate, "weekday")} {/* FIXED: NoRedeclare issue for formatDate and currentDate */}
                </button>
              </div>
              <button
                onClick={goToNextDay} // FIXED: NoRedeclare issue for goToNextDay
                className="p-2 hover:bg-accent rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground dark:text-muted-foreground"
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
            <div className="flex items-center justify-between bg-card rounded-xl p-3 mb-4 dark:bg-card">
              <button
                onClick={goToPreviousDay} // FIXED: NoRedeclare issue for goToPreviousDay
                className="p-2 hover:bg-accent rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground dark:text-muted-foreground"
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
                  className="font-semibold text-foreground dark:text-white hover:text-primary transition-colors"
                >
                  {formatDate(currentDate, "weekday")} {/* FIXED: NoRedeclare issue for formatDate and currentDate */}
                </button>
              </div>
              <button
                onClick={goToNextDay} // FIXED: NoRedeclare issue for goToNextDay
                className="p-2 hover:bg-accent rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground dark:text-muted-foreground"
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
            <div className="flex items-center justify-between bg-card rounded-xl p-3 mb-4 dark:bg-card">
              <button
                onClick={goToPreviousDay} // FIXED: NoRedeclare issue for goToPreviousDay
                className="p-2 hover:bg-accent rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground dark:text-muted-foreground"
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
                  className="font-semibold text-foreground dark:text-white hover:text-primary transition-colors"
                >
                  {formatDate(currentDate, "weekday")} {/* FIXED: NoRedeclare issue for formatDate and currentDate */}
                </button>
              </div>
              <button
                onClick={goToNextDay} // FIXED: NoRedeclare issue for goToNextDay
                className="p-2 hover:bg-accent rounded-lg dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground dark:text-muted-foreground"
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
              <div className="bg-card rounded-2xl shadow-sm border border-border p-6 dark:bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground dark:text-white">{t("mealPrep.title")}</h2>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">{t("mealPrep.basedOnMeals")}</p>
                  </div>
                  <button
                    onClick={handleGenerateMealPrep}
                    disabled={isMealPrepGenerating}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-destructive text-sm">
                    {mealPrepError}
                  </div>
                )}

                {/* Quick stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
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
                <div className="bg-card rounded-2xl shadow-sm border border-border p-8 dark:bg-card border-border">
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
                    <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
                      {t("mealPrep.noSuggestionsYet")}
                    </h3>
                    <p className="text-muted-foreground dark:text-muted-foreground mb-4">{t("mealPrep.logMealsFirst")}</p>
                    <button
                      onClick={() => setActiveView("tracker")}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      {t("mealPrep.goToTracker")}
                    </button>
                  </div>
                </div>
              )}

              {/* Batch Prep Tips Section */}
              {mealPrepSuggestions.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                  <h3 className="font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
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
                  <ul className="space-y-2 text-sm text-foreground dark:text-muted-foreground">
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
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 dark:bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground dark:text-white">{t("favorites.title")}</h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">{t("favorites.subtitle")}</p>
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
                      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider dark:text-muted-foreground">
                        Food Items
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {foodItemFavorites.map((item) => (
                          <div
                            key={item.id}
                            className="bg-card rounded-xl p-4 hover:shadow-md transition-shadow dark:bg-card"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.emoji || "🍽️"}</span>
                                <div>
                                  <h3 className="font-semibold text-foreground dark:text-white">{item.name}</h3>
                                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                    {item.calories} cal per serving
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  removeFoodItemFavorite(item.foodItemId!) // FIXED: NoRedeclare issue for removeFoodItemFavorite
                                }}
                                className="text-red-500 hover:text-destructive transition-colors"
                                title="Remove from favorites"
                              >
                                <Heart className="w-5 h-5 fill-current" />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
                              <span className="text-blue-600 font-medium">{item.protein}g protein</span>
                              <span className="text-amber-600 font-medium">{item.carbs}g carbs</span>
                              <span className="text-destructive font-medium">{item.fat}g fat</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recipe Favorites Section */}
                    {recipeFavorites.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider dark:text-muted-foreground">
                          Recipes
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {recipeFavorites.map((fav) => {
                            const mealWithRecipe = meals.find((m) => m.recipe?.id === fav.recipeId) // FIXED: NoRedeclare issue for meals
                            if (!mealWithRecipe?.recipe) return null

                            return (
                              <div
                                key={fav.id}
                                className="bg-card rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer dark:bg-card"
                                onClick={() => mealWithRecipe.recipe && handleViewRecipe(mealWithRecipe.recipe)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-foreground dark:text-white">
                                      {mealWithRecipe.recipe.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                      {mealWithRecipe.recipe.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleFavorite(mealWithRecipe.recipe!.id)
                                    }}
                                    className="text-red-500 hover:text-destructive transition-colors"
                                    title="Remove from favorites"
                                  >
                                    <Heart className="w-5 h-5 fill-current" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {mealWithRecipe.recipe.prepTimeMinutes + mealWithRecipe.recipe.cookTimeMinutes} min
                                  </span>
                                  <span className="text-primary font-medium dark:text-indigo-400">
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
                          className="bg-card rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer dark:bg-card"
                          onClick={() => mealWithRecipe.recipe && handleViewRecipe(mealWithRecipe.recipe)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground dark:text-white">
                                {mealWithRecipe.recipe.title}
                              </h3>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                {mealWithRecipe.recipe.description}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeRecipeFavorite(mealWithRecipe.recipe!.id) // FIXED: NoRedeclare issue for removeRecipeFavorite
                              }}
                              className="text-red-500 hover:text-destructive transition-colors"
                              title="Remove from favorites"
                            >
                              <Heart className="w-5 h-5 fill-current" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {mealWithRecipe.recipe.prepTimeMinutes + mealWithRecipe.recipe.cookTimeMinutes} min
                            </span>
                            <span className="text-primary font-medium dark:text-indigo-400">
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
                <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground">
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
        <div className="min-h-screen bg-card flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-card rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-red-50 px-6 py-8 text-center border-b border-red-100">
              <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                The application encountered an unexpected error. Your data is safe.
              </p>
            </div>
            <div className="px-6 py-4 bg-card border-b border-border">
              <div className="text-xs text-muted-foreground font-mono break-all">{error?.message ?? "Unknown error type"}</div>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-card transition-colors text-sm"
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
      <div className="min-h-screen bg-background pb-20 dark:bg-background">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUtilities={() => setIsUtilityOpen(true)}
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenCompare={() => setIsCompareOpen(true)}
          activeView={activeView}
          onViewChange={handleViewChange}
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

        <footer className="text-center py-6 text-sm text-muted-foreground dark:text-muted-foreground">
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
      <div className="min-h-screen flex items-center justify-center bg-card dark:bg-card">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Checking your session...</div>
      </div>
    )
  }

  if (!userId) {
    return <AuthScreen />
  }

  return <AuthenticatedApp />
}

export default App
