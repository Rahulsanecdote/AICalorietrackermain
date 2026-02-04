"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Sparkles,
  RotateCcw,
  Save,
  Loader2,
  ChefHat,
  Plus,
  Package,
  Target,
  ShoppingCart,
  Calendar,
} from "lucide-react"
import type { DailyMealPlan, MealPlanGenerationRequest, UserSettings, PantryInputData, FoodItem } from "../types"
import MealSectionCard from "./MealSectionCard"
import TemplateModal from "./TemplateModal"
import PantryInput from "./PantryInput"
import { notifyError } from "@/utils/notifications"
import { API_CONFIG } from "../constants"
import { postAIChat } from "../utils/aiClient"

interface MealPlanGeneratorProps {
  settings: UserSettings
  currentPlan: DailyMealPlan | null
  templates: any[]
  userPantry?: any
  isGenerating: boolean
  error: string | null
  onGeneratePlan: (request: MealPlanGenerationRequest) => Promise<void>
  onGeneratePlanFromPantry: (pantryData: PantryInputData) => Promise<void>
  onSavePantry: (pantryData: PantryInputData, saveAsDefault: boolean) => void
  onRegeneratePlan: () => Promise<void>
  onSaveTemplate: (name: string, description?: string) => void
  onLoadTemplate: (templateId: string) => void
  onClearPlan: () => void
  onUpdateFoodItem?: (mealType: string, itemId: string, newWeight: number) => void
  onAddMealToLog?: (mealType: string) => void
  onGenerateShoppingList?: () => void
  onGenerateMealPrep?: () => void
  onAddToShoppingList?: (item: FoodItem) => void
  onToggleFavorite?: (item: FoodItem) => void
  onSwapFood?: (mealType: string, itemId: string, newItem: FoodItem) => void
  isFavorite?: (item: FoodItem) => boolean
  isInShoppingList?: (item: FoodItem) => boolean
}

export default function MealPlanGenerator({
  settings,
  currentPlan,
  templates,
  userPantry,
  isGenerating,
  error,
  onGeneratePlan,
  onGeneratePlanFromPantry,
  onSavePantry,
  onRegeneratePlan,
  onSaveTemplate,
  onLoadTemplate,
  onClearPlan,
  onUpdateFoodItem,
  onAddMealToLog,
  onGenerateShoppingList,
  onGenerateMealPrep,
  onAddToShoppingList,
  onToggleFavorite,
  onSwapFood,
  isFavorite = () => false,
  isInShoppingList = () => false,
}: MealPlanGeneratorProps) {
  const { t } = useTranslation()
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showPantryInput, setShowPantryInput] = useState(false)
  const [swappingItemId, setSwappingItemId] = useState<string | null>(null)



  const handleAIPlanGeneration = async () => {
    console.log("[v0] Generate Suggestions clicked")

    const request: MealPlanGenerationRequest = {
      targetCalories: settings.dailyCalorieGoal,
      goal: settings.goal || "maintain",
      activityLevel: settings.activityLevel || "moderately_active",
      dietaryPreferences: settings.dietaryPreferences || [],
    }

    console.log("[v0] Calling onGeneratePlan with request:", request)

    try {
      await onGeneratePlan(request)
      console.log("[v0] Meal plan generation completed successfully")
    } catch (error) {
      console.error("[v0] Meal plan generation failed:", error)
      notifyError(`Failed to generate meal plan: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }



  const handleGeneratePlanFromPantry = async (pantryData: PantryInputData) => {
    await onGeneratePlanFromPantry(pantryData)
    setShowPantryInput(false)
  }

  const handleSavePantry = (pantryData: PantryInputData, saveAsDefault: boolean) => {
    onSavePantry(pantryData, saveAsDefault)
  }

  const calculateAccuracy = () => {
    if (!currentPlan || !currentPlan.accuracyVariance) return null

    const variance = currentPlan.accuracyVariance
    const accuracy = Math.max(0, 100 - (variance / settings.dailyCalorieGoal) * 100)
    const isAccurate = variance <= 20

    return {
      variance,
      accuracy: Math.round(accuracy),
      isAccurate,
      status: isAccurate ? "excellent" : variance <= 50 ? "good" : "poor",
    }
  }

  const calculateDailyTotals = () => {
    if (!currentPlan) return { calories: 0, protein: 0, carbs: 0, fat: 0 }

    return currentPlan.meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.totalCalories,
        protein: totals.protein + meal.totalProtein,
        carbs: totals.carbs + meal.totalCarbs,
        fat: totals.fat + meal.totalFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }

  const dailyTotals = calculateDailyTotals()
  const calorieProgress = Math.min((dailyTotals.calories / settings.dailyCalorieGoal) * 100, 100)
  const isOverGoal = dailyTotals.calories > settings.dailyCalorieGoal

  // Determine which view to show
  const getViewType = () => {
    if (isGenerating) return "loading"
    if (error) return "error"
    if (currentPlan) return "plan"
    return "empty"
  }

  const viewType = getViewType()

  // Handle swapping a food item with an alternative
  const handleSwapFood = async (mealType: string, itemId: string) => {
    if (!currentPlan || !onSwapFood) return

    // Find the current item
    const meal = currentPlan.meals.find((m) => m.type === mealType)
    const currentItem = meal?.items.find((i) => i.id === itemId)
    if (!currentItem) return

    setSwappingItemId(itemId)

    try {
      // Call AI to get a replacement food item
      const systemPrompt = `You are a nutrition expert. Return ONLY valid JSON for a replacement food item.

Required format:
{
  "name": "Food Name",
  "weight": 100,
  "unit": "g",
  "calories": 150,
  "protein": 5,
  "carbs": 27,
  "fat": 3,
  "emoji": "🍽️"
}

Rules:
1. Provide a similar food with comparable calories and macros
2. Return valid JSON only, no markdown`

      const userPrompt = `Find a replacement for "${currentItem.name}" (${currentItem.weightGrams}g, ${currentItem.calories} cal, ${currentItem.protein}g protein, ${currentItem.carbs}g carbs, ${currentItem.fat}g fat) in a ${mealType} meal.

Requirements:
- Similar calorie and macro profile
- Different food from the original
- Return ONLY the JSON object`

      const response = await postAIChat({
        model: API_CONFIG.MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      })

      if (!response.ok) {
        throw new Error("Failed to get replacement food")
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error("No response from AI")
      }

      // Clean up and parse the response
      const cleanedContent = content.replace(/```json\s*|\s*```/g, "").trim()
      const parsedResponse = JSON.parse(cleanedContent)

      // Create the new food item
      const newItem: FoodItem = {
        id: itemId, // Keep the same ID to maintain reactivity
        name: parsedResponse.name || currentItem.name,
        weightGrams: parsedResponse.weight || currentItem.weightGrams,
        calories: parsedResponse.calories || currentItem.calories,
        protein: parsedResponse.protein || currentItem.protein,
        carbs: parsedResponse.carbs || currentItem.carbs,
        fat: parsedResponse.fat || currentItem.fat,
        emoji: parsedResponse.emoji,
      }

      // Call the callback to swap the item
      onSwapFood(mealType, itemId, newItem)
    } catch (err) {
      console.error("Error swapping food:", err)
      // Fallback: just remove the item from the meal
      const newItem: FoodItem = {
        ...currentItem,
        name: `${currentItem.name} (alternative)`,
      }
      onSwapFood(mealType, itemId, newItem)
    } finally {
      setSwappingItemId(null)
    }
  }

  // Always render modals on top
  const renderModals = () => (
    <>
      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} onSave={onSaveTemplate} />
      )}

      {/* Pantry Input Modal - Rendered regardless of currentPlan state */}
      <PantryInput
        isOpen={showPantryInput}
        onClose={() => setShowPantryInput(false)}
        initialData={
          userPantry
            ? {
              breakfast: userPantry.breakfast,
              lunch: userPantry.lunch,
              dinner: userPantry.dinner,
              snacks: userPantry.snacks,
            }
            : undefined
        }
        onSave={handleSavePantry}
        onGeneratePlan={handleGeneratePlanFromPantry}
      />
    </>
  )

  // Empty state - Show smart meal planning buttons
  if (viewType === "empty") {
    return (
      <>
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
              <ChefHat className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">{t("mealPlan.title")}</h2>

            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("mealPlan.subtitle")}</p>

            <div className="space-y-4">
              {/* Pantry-Based Planning */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-primary">{t("mealPlan.pantryTitle")}</h3>
                </div>
                <p className="text-sm text-primary/80 mb-3">{t("mealPlan.pantryDescription")}</p>
                <button
                  id="pantry-button-test"
                  onClick={() => setShowPantryInput(true)}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium disabled:opacity-50"
                >
                  <Package className="w-4 h-4" />
                  {t("mealPlan.pantryButton")}
                </button>
              </div>

              {/* AI Suggestions */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">{t("mealPlan.aiTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{t("mealPlan.aiDescription")}</p>
                <button
                  id="ai-suggestions-test"
                  onClick={handleAIPlanGeneration}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all font-medium disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {t("mealPlan.aiButton")}
                </button>
              </div>
            </div>

            {templates.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">{t("mealPlan.templatesTitle")}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {templates.slice(0, 3).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onLoadTemplate(template.id)}
                      className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {renderModals()}
      </>
    )
  }

  // Loading state
  if (viewType === "loading") {
    return (
      <>
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">{t("mealPlan.loadingTitle")}</h2>

            <p className="text-muted-foreground mb-4">{t("mealPlan.loadingSubtitle")}</p>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">{t("mealPlan.loadingAnalyzing")}</span>
              </div>
            </div>
          </div>
        </div>
        {renderModals()}
      </>
    )
  }

  // Error state
  if (viewType === "error") {
    return (
      <>
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-2xl mb-4">
              <ChefHat className="w-8 h-8 text-destructive" />
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">{t("mealPlan.errorTitle")}</h2>

            <p className="text-muted-foreground mb-4">{error}</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleAIPlanGeneration}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t("mealPlan.errorButton")}
              </button>
            </div>
          </div>
        </div>
        {renderModals()}
      </>
    )
  }

  // Plan display state (currentPlan exists)
  return (
    <>
      <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-amber-500" />
              {t("mealPlan.planTitle")}
              {currentPlan?.sourceType === "pantry_based" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  <Package className="w-3 h-3" />
                  {t("mealPlan.fromPantry")}
                </span>
              )}
            </h2>
            {currentPlan?.summary && <p className="text-sm text-muted-foreground mt-1">{currentPlan.summary}</p>}

            {/* Accuracy Indicator */}
            {(() => {
              const accuracy = calculateAccuracy()
              if (!accuracy) return null

              return (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${accuracy.status === "excellent"
                      ? "bg-green-100 text-green-700"
                      : accuracy.status === "good"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-destructive/20 text-destructive"
                      }`}
                  >
                    <Target className="w-3 h-3" />
                    {accuracy.isAccurate ? (
                      <>
                        ✓ {accuracy.accuracy}% {t("mealPlan.accurate")} ({dailyTotals.calories} /{" "}
                        {settings.dailyCalorieGoal} {t("mealPlan.cal")})
                      </>
                    ) : (
                      <>
                        ⚠ {accuracy.variance} {t("mealPlan.calVariance")} ({dailyTotals.calories} /{" "}
                        {settings.dailyCalorieGoal} {t("mealPlan.cal")})
                      </>
                    )}
                  </div>
                  {currentPlan?.regenerationCount && currentPlan.regenerationCount > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {t("mealPlan.attempts", { count: currentPlan.regenerationCount })}
                    </span>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              title={t("mealPlan.saveTemplate")}
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={onRegeneratePlan}
              className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              title={t("mealPlan.regenerate")}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            {onGenerateShoppingList && (
              <button
                onClick={onGenerateShoppingList}
                className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title={t("mealPlan.shoppingList")}
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
            {onGenerateMealPrep && (
              <button
                onClick={onGenerateMealPrep}
                className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title={t("mealPlan.mealPrep")}
              >
                <Calendar className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClearPlan}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title={t("mealPlan.clearPlan")}
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">{t("mealPlan.dailyProgress")}</span>
            <span className={`text-sm font-bold ${isOverGoal ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
              {Math.round(calorieProgress)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isOverGoal ? "bg-destructive" : "bg-gradient-to-r from-amber-400 to-orange-400"
                }`}
              style={{ width: `${calorieProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-foreground">{dailyTotals.calories}</div>
              <div className="text-xs text-muted-foreground">
                {t("mealPlan.goal")}: {settings.dailyCalorieGoal}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">{Math.round(dailyTotals.protein)}g</div>
              <div className="text-xs text-muted-foreground">{t("mealPlan.protein")}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-500">{Math.round(dailyTotals.carbs)}g</div>
              <div className="text-xs text-muted-foreground">{t("mealPlan.carbs")}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-500">{Math.round(dailyTotals.fat)}g</div>
              <div className="text-xs text-muted-foreground">{t("mealPlan.fat")}</div>
            </div>
          </div>
        </div>

        {/* Meal Sections */}
        <div className="space-y-4">
          {currentPlan?.meals.map((meal) => (
            <MealSectionCard
              key={meal.type}
              meal={meal}
              onAddToLog={() => onAddMealToLog?.(meal.type)}
              onUpdateFoodItem={(itemId, newWeight) => onUpdateFoodItem?.(meal.type, itemId, newWeight)}
              onAddToShoppingList={onAddToShoppingList}
              onToggleFavorite={onToggleFavorite}
              onSwapFood={(itemId) => handleSwapFood(meal.type, itemId)}
              isFavorite={isFavorite}
              isInShoppingList={isInShoppingList}
              isSwapping={(itemId) => swappingItemId === itemId}
            />
          ))}
        </div>
      </div>
      {renderModals()}
    </>
  )
}
