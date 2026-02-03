"use client"


import { Plus, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { MealSection, FoodItem } from "../types"
import EditableFoodItem from "./EditableFoodItem"

interface MealSectionCardProps {
  meal: MealSection
  onAddToLog: () => void
  onUpdateFoodItem?: (itemId: string, newWeight: number) => void
  onAddToShoppingList?: (item: FoodItem) => void
  onToggleFavorite?: (item: FoodItem) => void
  onSwapFood?: (itemId: string) => void
  isFavorite?: (item: FoodItem) => boolean
  isInShoppingList?: (item: FoodItem) => boolean
  isSwapping?: (itemId: string) => boolean
}

const defaultColors = {
  bg: "bg-gray-50",
  border: "border-gray-200",
  accent: "text-gray-600",
  icon: "🍽️",
}

const mealColors: Record<string, typeof defaultColors> = {
  breakfast: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    accent: "text-amber-600",
    icon: "🌅",
  },
  lunch: {
    bg: "bg-green-50",
    border: "border-green-200",
    accent: "text-green-600",
    icon: "☀️",
  },
  dinner: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    accent: "text-indigo-600",
    icon: "🌙",
  },
  snack: {
    bg: "bg-pink-50",
    border: "border-pink-200",
    accent: "text-pink-600",
    icon: "🍿",
  },
}

export default function MealSectionCard({
  meal,
  onAddToLog,
  onUpdateFoodItem,
  onAddToShoppingList,
  onToggleFavorite,
  onSwapFood,
  isFavorite = () => false,
  isInShoppingList = () => false,
  isSwapping = () => false,
}: MealSectionCardProps) {
  const { t } = useTranslation();

  // Get translated meal type label
  const getMealTypeLabel = (type: string) => t(`meals.${type}`);

  const mealType = meal?.type || "snack"
  const colors = mealColors[mealType] || defaultColors

  const handleUpdateFoodItem = (itemId: string, newWeight: number) => {
    if (onUpdateFoodItem) {
      onUpdateFoodItem(itemId, newWeight)
    }
  }

  const getTimeEstimate = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return "7:00 AM"
      case "lunch":
        return "12:00 PM"
      case "dinner":
        return "6:00 PM"
      case "snack":
        return "3:00 PM"
      default:
        return ""
    }
  }

  if (!meal) {
    return null
  }

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 transition-all hover:shadow-sm`}>
      {/* Meal Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{colors.icon}</span>
          <div>
            <h3 className={`font-semibold ${colors.accent} capitalize`}>{getMealTypeLabel(mealType)}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{getTimeEstimate(mealType)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{meal.totalCalories || 0}</div>
            <div className="text-xs text-gray-500">{t('meals.calories')}</div>
          </div>
          <button
            onClick={onAddToLog}
            className={`${colors.accent} hover:bg-white/50 p-2 rounded-lg transition-colors`}
            title={t('mealPlan.addAllToLog')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Food Items */}
      <div className="space-y-3">
        {(meal.items || []).map((item) => (
          <EditableFoodItem
            key={item.id}
            item={item}
            onUpdateWeight={(newWeight) => handleUpdateFoodItem(item.id, newWeight)}
            accentColor={colors.accent}
            onSwapFood={
              onSwapFood
                ? (itemId) => {
                  handleUpdateFoodItem(itemId, item.weightGrams)
                  onSwapFood(itemId)
                }
                : undefined
            }
            onAddToShoppingList={onAddToShoppingList}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
            isFavorite={isFavorite(item)}
            isInShoppingList={isInShoppingList(item)}
            isSwapping={isSwapping(item.id)}
          />
        ))}
      </div>

      {/* Meal Macros Summary */}
      <div className="mt-4 pt-3 border-t border-white/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-semibold text-gray-900">{Math.round(meal.totalProtein || 0)}g</div>
            <div className="text-xs text-gray-500">{t('meals.protein')}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{Math.round(meal.totalCarbs || 0)}g</div>
            <div className="text-xs text-gray-500">{t('meals.carbs')}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{Math.round(meal.totalFat || 0)}g</div>
            <div className="text-xs text-gray-500">{t('meals.fat')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
