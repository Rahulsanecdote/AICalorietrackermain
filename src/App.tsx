"use client"

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { v4 as uuidv4 } from "uuid"
import { Toaster } from "sonner" // ✅ Add this import (or from wherever your toast library is)
// Alternative if using react-hot-toast:
// import { Toaster } from "react-hot-toast"
import { useApp } from "./context/AppContext"
import { useAuth } from "./context/AuthContext"
import { useDate } from "./context/DateContext"
import useNutritionAI from "./hooks/useNutritionAI"
import useMealPlanner from "./hooks/useMealPlanner"
import { useShoppingList } from "./hooks/useShoppingList"
import { useFavorites } from "./hooks/useFavorites"
import type { Meal, UserSettings, MealCategory, ActiveView, DailyTotals } from "./types"
import type { Recipe } from "./types/recipes"
import type { VoiceDetectedFood } from "./types/ai"
import { createTimestampFromLocal, formatDate, getTodayStr } from "./utils/dateHelpers"
import {
  EditMealModal,
  Header,
  MealInput,
  MealList,
  SettingsModal,
  AuthScreen,
  UtilityPanel,
  QuickAddWidget,
  RecipeDetailModal,
  VoiceLoggerModal,
  FoodVersusCard,
  NutriBotWidget,
  TrackerDatePicker,
} from "./components"
import { FeatureErrorBoundary, RootErrorBoundary, OnlineStatusBar } from "./components/system"
import { ErrorBanner } from "./components/ui/ErrorBanner"
import { DebugTools } from "./components/ui/DebugTools"
import { MealPlannerBoundary, InsightsBoundary, LifestyleBoundary, AnalyticsBoundary, ShoppingListBoundary, MealPrepBoundary } from "./components/features/FeatureBoundaries"
import { MonitoringDebugPanel } from "./components/MonitoringDebugPanel"
import { OnlineStatusProvider, useOnlineStatusContext } from "./context/OnlineStatusContext"
import { notifySuccess, notifyError, notifyInfo } from "./utils/notifications"

// Lazy loaded components
const LifestyleDashboard = React.lazy(() => import("./components/lifestyle/LifestyleDashboard"))
const InsightsDashboard = React.lazy(() => import("./components/features/InsightsDashboard"))
const ShoppingListView = React.lazy(() => import("./components/shopping/ShoppingListView"))
const AnalyticsDashboard = React.lazy(() => import("./components/analytics/AnalyticsDashboard"))
const ProgressBreakdownCard = React.lazy(() => import("./components/tracker/ProgressBreakdownCard"))
const MealPlanGenerator = React.lazy(() => import("./components/MealPlanGenerator"))


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
    updateMeal,
    deleteMeal,
    getMealsForDate,
    settings,
    updateSettings,
  } = useApp()
  
  const { signOut: handleSignOut, email } = useAuth()
  
  const { analyzeFood, error: hookAiError } = useNutritionAI()
  
  const {
    items: shoppingListItems,
    clearList,
    removeItem,
    toggleItemCheck,
    addCustomItem,
    addItem: addMealToShoppingList,
    generateListFromMeals
  } = useShoppingList()
  
  const { isFavorite, toggleFavorite } = useFavorites()
  
  const { isOnline } = useOnlineStatusContext()
  const { selectedDate, setSelectedDate } = useDate()

  // View state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUtilityOpen, setIsUtilityOpen] = useState(false)
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>("tracker")
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [isDateLoading, setIsDateLoading] = useState(false)

  // Local AI error state
  const [aiError, setAiError] = useState<string | null>(null)

  const currentDayMeals = useMemo(() => getMealsForDate(selectedDate), [getMealsForDate, selectedDate])
  const selectedDayTotals = useMemo<DailyTotals>(
    () =>
      currentDayMeals.reduce<DailyTotals>(
        (totals, meal) => ({
          calories: totals.calories + meal.nutrition.calories,
          protein_g: totals.protein_g + meal.nutrition.protein_g,
          carbs_g: totals.carbs_g + meal.nutrition.carbs_g,
          fat_g: totals.fat_g + meal.nutrition.fat_g,
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      ),
    [currentDayMeals],
  )
  const selectedDateLabel = formatDate(selectedDate, "weekday")
  const selectedDateIsToday = selectedDate === getTodayStr()

  const handleDateChange = useCallback(
    (nextDate: string) => {
      if (nextDate === selectedDate) {
        return
      }
      setIsDateLoading(true)
      setSelectedDate(nextDate)
    },
    [selectedDate, setSelectedDate],
  )

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }


  const handleDeleteMeal = (id: string) => {
    deleteMeal(id)
    notifySuccess("Meal deleted")
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
  }

  const handleSaveEditedMeal = (updatedMeal: Meal) => {
    updateMeal(updatedMeal)
    setEditingMeal(null)
    notifySuccess("Meal updated")
  }

  const handleSettingsSave = (newSettings: Partial<UserSettings>) => {
    updateSettings(newSettings)
    setIsSettingsOpen(false)
    notifySuccess("Settings saved")
  }

  const handleImportMeals = (importedMeals: Partial<Meal>[]) => {
    const newMeals: Meal[] = importedMeals.map((meal) => ({
      id: uuidv4(),
      foodName: meal.foodName || "Unknown",
      description: meal.description || meal.foodName || "Unknown",
      servingSize: meal.servingSize || "1 serving",
      category: meal.category || "snack",
      nutrition: meal.nutrition || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      timestamp: createTimestampFromLocal(selectedDate),
    }))

    newMeals.forEach((meal) => addMealDirectly(meal))
    notifySuccess(`Imported ${newMeals.length} meals`)
    setIsUtilityOpen(false)
  }

  const handleVoiceConfirm = (foods: VoiceDetectedFood[]) => {
    foods.forEach(food => {
      const newMeal: Meal = {
        id: uuidv4(),
        description: `${food.quantity} ${food.unit} of ${food.name}`,
        foodName: food.name,
        servingSize: `${food.quantity} ${food.unit}`,
        nutrition: {
          calories: food.estimatedCalories,
          protein_g: food.macros.protein_g,
          carbs_g: food.macros.carbs_g,
          fat_g: food.macros.fat_g,
        },
        timestamp: createTimestampFromLocal(selectedDate),
        category: 'snack'
      }
      addMealDirectly(newMeal)
    })
    setIsVoiceOpen(false)
    notifySuccess(`Added ${foods.length} items from voice`)
  }

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsRecipeModalOpen(true)
  }

  const handleToggleFavorite = (recipeId: string) => {
    const wasFavorite = isFavorite(recipeId)
    toggleFavorite(recipeId)
    notifySuccess(wasFavorite ? "Removed from favorites" : "Added to favorites")
  }

  const handleGenerateShoppingList = () => {
    generateListFromMeals(meals, selectedDate)
    setActiveView("shopping")
    notifySuccess("Shopping list generated from selected date meals")
  }

  const handleGenerateMealPrep = () => {
    setActiveView("mealprep")
    notifyInfo("Meal prep view implementation pending")
  }

  const handleAddMeal = async (description: string, category: MealCategory) => {
    setAiError(null)

    if (!isOnline) {
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
        timestamp: createTimestampFromLocal(selectedDate),
        category,
      }

      addMealDirectly(newMeal)
    } else {
      if (hookAiError) {
        setAiError(hookAiError.userMessage)
      }
    }
  }

  const {
    currentPlan,
    templates,
    userPantry,
    isGenerating,
    error: mealPlannerError,
    generateMealPlan,
    generateMealPlanFromPantry,
    savePantry,
    regenerateMealPlan,
    saveTemplate,
    loadTemplate,
    clearPlan,
    updateFoodItem,
    addMealToLog,
    swapFoodItem,
  } = useMealPlanner(settings, handleAddMeal)

  // Test API handler for DebugTools
  const testAPI = async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) notifySuccess("API Health OK")
      else notifyError("API Health Check Failed")
    } catch {
      notifyError("API Health Check Error")
    }
  }

  const isFoodItemFavorite = (id: string) => isFavorite(id)
  const isItemInListByName = (name: string) => shoppingListItems.some((i: { name: string }) => i.name === name)

  // Effect to sync AI hook error to local state if needed
  useEffect(() => {
    if (hookAiError) {
      // ✅ Handle both string and object types
      const errorMessage = typeof hookAiError === 'string'
        ? hookAiError
        : hookAiError.userMessage || hookAiError.message || 'An error occurred'

      setAiError(errorMessage)
    }
  }, [hookAiError])

  // Error notification effect
  useEffect(() => {
    if (aiError) {
      notifyError(aiError)
      const timer = setTimeout(() => setAiError(null), 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [aiError])

  useEffect(() => {
    if (!isDateLoading) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setIsDateLoading(false)
    }, 120)

    return () => window.clearTimeout(timer)
  }, [selectedDate, isDateLoading])

  const renderView = () => {
    switch (activeView) {
      case "tracker":
        return (
          <>
            <TrackerDatePicker selectedDate={selectedDate} onDateChange={handleDateChange} isLoading={isDateLoading} />

            <FeatureErrorBoundary feature="calorie-dashboard">
              <Suspense
                fallback={
                  <DashboardLoadingCard title="Loading dashboard" description="Calculating daily totals." />
                }
              >
                <ProgressBreakdownCard
                  totals={selectedDayTotals}
                  settings={settings}
                />
              </Suspense>
            </FeatureErrorBoundary>

            <MealPlannerBoundary>
              <Suspense
                fallback={
                  <DashboardLoadingCard title="Loading meal planner" description="Getting suggestions." />
                }
              >
                <MealPlanGenerator
                  settings={settings}
                  currentPlan={currentPlan}
                  templates={templates}
                  userPantry={userPantry ?? settings.defaultPantry ?? null}
                  isGenerating={isGenerating}
                  error={mealPlannerError ? mealPlannerError.userMessage : null}
                  onGeneratePlan={generateMealPlan}
                  onGeneratePlanFromPantry={generateMealPlanFromPantry}
                  onSavePantry={savePantry}
                  onRegeneratePlan={regenerateMealPlan}
                  onSaveTemplate={saveTemplate}
                  onLoadTemplate={loadTemplate}
                  onClearPlan={clearPlan}
                  onUpdateFoodItem={updateFoodItem}
                  onAddMealToLog={addMealToLog}
                  onGenerateShoppingList={handleGenerateShoppingList}
                  onGenerateMealPrep={handleGenerateMealPrep}
                  onAddToShoppingList={(item) => {
                    addMealToShoppingList({
                      id: item.id,
                      name: item.name,
                      category: "other",
                      amount: 1,
                      unit: "serving",
                      checked: false,
                      recipeNames: [item.name],
                      sourceRecipeIds: []
                    })
                  }}
                  onToggleFavorite={() => {
                    notifyInfo("Toggle favorite food item")
                  }}
                  isFavorite={(item) => isFoodItemFavorite(item.id)}
                  isInShoppingList={(item) => isItemInListByName(item.name)}
                  onSwapFood={swapFoodItem}
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
              isLoading={false}
              error={aiError}
              onVoiceClick={() => setIsVoiceOpen(true)}
            />

            {/* Meals for Selected Date */}
            <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {selectedDateIsToday ? (t("meals.todaysMeals") || "Today's Meals") : `Meals for ${selectedDateLabel}`}
              </h2>
              <MealList
                meals={currentDayMeals}
                isLoading={isDateLoading}
                emptyTitle="No meals logged for this day."
                emptyDescription="No meals logged for this day."
                onDelete={handleDeleteMeal}
                onEdit={handleEditMeal}
                onViewRecipe={handleViewRecipe}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={(recipeId) => isFavorite(recipeId)}
                onAddToShoppingList={(meal) => {
                  if (meal.recipe) {
                    notifyInfo("Added recipe ingredients to list")
                  } else {
                    addMealToShoppingList({
                      id: meal.id,
                      name: meal.foodName,
                      category: "other",
                      amount: 1,
                      unit: "serving",
                      checked: false,
                      recipeNames: [meal.foodName],
                      sourceRecipeIds: []
                    })
                  }
                }}
                isInShoppingList={(meal) =>
                  meal.recipe ? isItemInListByName(meal.recipe.title) : isItemInListByName(meal.foodName)
                }
              />
            </div>
          </>
        )

      case "lifestyle":
        return (
          <LifestyleBoundary onBasicView={() => setActiveView("tracker")}>
            <Suspense
              fallback={
                <DashboardLoadingCard title="Loading lifestyle dashboard" description="Syncing wellness data." />
              }
            >
              <LifestyleDashboard date={selectedDate} />
            </Suspense>
          </LifestyleBoundary>
        )

      case "analytics":
        return (
          <AnalyticsBoundary
            onRawView={() => {
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
        )

      case "shopping":
        return (
          <ShoppingListBoundary>
            <Suspense
              fallback={
                <DashboardLoadingCard title="Loading shopping list" description="Fetching your items." />
              }
            >
              <ShoppingListView
                shoppingList={{ id: "temp", weekStartDate: new Date().toISOString(), items: [], generatedAt: new Date().toISOString() }}
                onToggleItem={toggleItemCheck}
                onRemoveItem={removeItem}
                onAddCustomItem={addCustomItem}
                onClearList={() => {
                  clearList()
                }}
                onClose={() => setActiveView("tracker")}
              />
            </Suspense>
          </ShoppingListBoundary>
        )

      case "mealprep":
        return (
          <MealPrepBoundary onBackToTracker={() => setActiveView("tracker")}>
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-4">Meal Prep</h2>
                <p className="text-muted-foreground">Meal prep suggestions will appear here.</p>
                <button onClick={() => setActiveView("tracker")} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Back to Tracker</button>
              </div>
            </div>
          </MealPrepBoundary>
        )

      case "favorites":
        return (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 dark:bg-card border-border">
            <h2 className="text-lg font-semibold text-foreground dark:text-white mb-6">{t("favorites.title")}</h2>
            <p className="text-muted-foreground">Favorites view implementation pending.</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <RootErrorBoundary feature="app-root">
      <div className="min-h-screen bg-background pb-20 dark:bg-background">
        <Toaster />
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUtilities={() => setIsUtilityOpen(true)}
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenCompare={() => setIsCompareOpen(true)}
          activeView={activeView}
          onViewChange={handleViewChange}
          userEmail={email || "User"}
          onSignOut={handleSignOut}
        />

        <main id="main-content" className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <OnlineStatusBar isOnline={isOnline} />
          {renderView()}
        </main>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={handleSettingsSave}
        />

        {editingMeal && (
          <EditMealModal
            isOpen={!!editingMeal}
            onClose={() => setEditingMeal(null)}
            meal={editingMeal}
            onSave={handleSaveEditedMeal}
          />
        )}

        {selectedRecipe && (
          <RecipeDetailModal
            recipe={selectedRecipe}
            isOpen={isRecipeModalOpen}
            onClose={() => {
              setIsRecipeModalOpen(false)
              setSelectedRecipe(null)
            }}
            onToggleFavorite={() => handleToggleFavorite(selectedRecipe.id)}
            isFavorite={isFavorite(selectedRecipe.id)}
          />
        )}

        <UtilityPanel
          meals={meals}
          settings={settings}
          dailyTotals={selectedDayTotals}
          onImportMeals={handleImportMeals}
          isOpen={isUtilityOpen}
          onClose={() => setIsUtilityOpen(false)}
        />

        <VoiceLoggerModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onConfirm={handleVoiceConfirm} />
        <FoodVersusCard isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
        <NutriBotWidget />
        <QuickAddWidget
          onMealAdded={(meal: Meal) => {
            addMealDirectly(meal)
            notifySuccess("Quick added meal")
          }}
        />
        <ErrorBanner />
        <MonitoringDebugPanel />
        <DebugTools testAPI={testAPI} onOpenUtilities={() => setIsUtilityOpen(true)} />

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

  return (
    <FeatureErrorBoundary feature="app-root">
      <OnlineStatusProvider>
        <AuthenticatedApp />
      </OnlineStatusProvider>
    </FeatureErrorBoundary>
  )
}

export default App
