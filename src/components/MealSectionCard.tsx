"use client"

import { Clock, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { GridPatternCard, GridPatternCardBody } from "@/components/ui/card-with-grid-ellipsis-pattern"
import type { FoodItem, MealSection } from "../types"
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

const defaultMealTone = {
  icon: "🍽️",
  accentText: "text-primary",
  accentGlow: "shadow-[0_0_0_1px_hsl(var(--primary)/0.24)]",
  accentBorder: "bg-primary/70",
}

const mealTones: Record<string, typeof defaultMealTone> = {
  breakfast: {
    icon: "🌅",
    accentText: "text-amber-300 dark:text-amber-200",
    accentGlow: "shadow-[0_0_0_1px_hsl(39_100%_65%/0.25)]",
    accentBorder: "bg-amber-400/75",
  },
  lunch: {
    icon: "☀️",
    accentText: "text-emerald-300 dark:text-emerald-200",
    accentGlow: "shadow-[0_0_0_1px_hsl(151_66%_53%/0.22)]",
    accentBorder: "bg-emerald-400/70",
  },
  dinner: {
    icon: "🌙",
    accentText: "text-sky-300 dark:text-sky-200",
    accentGlow: "shadow-[0_0_0_1px_hsl(197_88%_63%/0.24)]",
    accentBorder: "bg-sky-400/70",
  },
  snack: {
    icon: "🍿",
    accentText: "text-rose-300 dark:text-rose-200",
    accentGlow: "shadow-[0_0_0_1px_hsl(343_82%_65%/0.22)]",
    accentBorder: "bg-rose-400/70",
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
  const { t } = useTranslation()

  const getMealTypeLabel = (type: string) => t(`meals.${type}`)

  const mealType = meal?.type || "snack"
  const mealTone = mealTones[mealType] || defaultMealTone

  const handleUpdateFoodItem = (itemId: string, newWeight: number) => {
    if (onUpdateFoodItem) {
      onUpdateFoodItem(itemId, newWeight)
    }
  }

  const getTimeEstimate = (mealTypeValue: string) => {
    switch (mealTypeValue) {
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
    <GridPatternCard className="group relative transition-all duration-200 md:hover:-translate-y-0.5 md:hover:border-border/70 md:hover:shadow-[0_16px_36px_hsl(var(--foreground)/0.16)]">
      <span className={cn("absolute inset-x-0 top-0 h-0.5", mealTone.accentBorder)} aria-hidden />
      <GridPatternCardBody className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">{mealTone.icon}</span>
            <div>
              <h3 className={cn("text-lg font-semibold capitalize", mealTone.accentText)}>
                {getMealTypeLabel(mealType)}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getTimeEstimate(mealType)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold leading-none text-foreground">{meal.totalCalories || 0}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{t("meals.calories")}</div>
            </div>
            <button
              onClick={onAddToLog}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/45 bg-background/45 text-foreground transition-all duration-200",
                "supports-[backdrop-filter]:backdrop-blur-xl hover:bg-background/70 hover:text-primary md:hover:scale-[1.04]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                mealTone.accentGlow
              )}
              title={t("mealPlan.addAllToLog")}
              aria-label={t("mealPlan.addAllToLog")}
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {(meal.items || []).map((item) => (
            <EditableFoodItem
              key={item.id}
              item={item}
              onUpdateWeight={(newWeight) => handleUpdateFoodItem(item.id, newWeight)}
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

        <div className="border-t border-border/45 pt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border/35 bg-background/30 px-2 py-2">
              <div className="text-sm font-semibold text-foreground">{Math.round(meal.totalProtein || 0)}g</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("meals.protein")}</div>
            </div>
            <div className="rounded-lg border border-border/35 bg-background/30 px-2 py-2">
              <div className="text-sm font-semibold text-foreground">{Math.round(meal.totalCarbs || 0)}g</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("meals.carbs")}</div>
            </div>
            <div className="rounded-lg border border-border/35 bg-background/30 px-2 py-2">
              <div className="text-sm font-semibold text-foreground">{Math.round(meal.totalFat || 0)}g</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("meals.fat")}</div>
            </div>
          </div>
        </div>
      </GridPatternCardBody>
    </GridPatternCard>
  )
}
