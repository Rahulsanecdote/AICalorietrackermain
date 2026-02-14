import React, { useState } from "react"
import { Edit2, Heart, ShoppingCart, Shuffle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useFoodTranslation } from "../hooks/useFoodTranslation"
import { FoodItem } from "../types"
import { getMeasurementDisplay } from "../utils/foodMeasurements"
import NumericSliderField from "./ui/NumericSliderField"
import { cn } from "@/lib/utils"

interface EditableFoodItemProps {
  item: FoodItem
  onUpdateWeight: (newWeight: number) => void
  onSwapFood?: (itemId: string) => void
  onAddToShoppingList?: (item: FoodItem) => void
  onToggleFavorite?: (item: FoodItem) => void
  isFavorite?: boolean
  isInShoppingList?: boolean
  isSwapping?: boolean
}

const actionButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/45 bg-background/45 text-muted-foreground transition-all duration-200 supports-[backdrop-filter]:backdrop-blur-xl hover:bg-background/70 hover:text-foreground md:hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export default function EditableFoodItem({
  item,
  onUpdateWeight,
  onSwapFood,
  onAddToShoppingList,
  onToggleFavorite,
  isFavorite = false,
  isInShoppingList = false,
  isSwapping = false,
}: EditableFoodItemProps) {
  const { t } = useTranslation()
  const { translateFood } = useFoodTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [valueInput, setValueInput] = useState(item.weightGrams)

  const formatNumber = (num: number) => (num % 1 === 0 ? num.toString() : num.toFixed(1))

  const handleSubmit = () => {
    if (!isNaN(valueInput) && valueInput > 0 && valueInput !== item.weightGrams) {
      onUpdateWeight(valueInput)
    }
    setIsEditing(false)
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/45 bg-background/45 p-3 supports-[backdrop-filter]:backdrop-blur-lg transition-all duration-200 hover:border-border/65 hover:bg-background/60 md:hover:-translate-y-0.5 md:hover:shadow-[0_10px_24px_hsl(var(--foreground)/0.12)]">
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.22),transparent_52%)]"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{item.emoji ?? "🍽️"}</span>
              <h4 className="truncate text-base font-medium text-foreground">{translateFood(item.name)}</h4>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-border/45 bg-background/35 px-2 py-0.5 text-[11px] text-muted-foreground">
                {formatNumber(item.calories)} {t("meals.cal")}
              </span>
              <span className="rounded-full border border-blue-500/35 bg-blue-500/12 px-2 py-0.5 text-[11px] text-blue-500">
                {formatNumber(item.protein)}g {t("meals.protein")}
              </span>
              <span className="rounded-full border border-amber-500/35 bg-amber-500/12 px-2 py-0.5 text-[11px] text-amber-500">
                {formatNumber(item.carbs)}g {t("meals.carbs")}
              </span>
              <span className="rounded-full border border-rose-500/35 bg-rose-500/12 px-2 py-0.5 text-[11px] text-rose-400">
                {formatNumber(item.fat)}g {t("meals.fat")}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isEditing ? (
              <div className="flex items-center gap-2 rounded-full border border-border/45 bg-background/55 px-2 py-1">
                <span className="text-xs font-semibold text-foreground">{formatNumber(valueInput)}g</span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValueInput(item.weightGrams)
                    setIsEditing(false)
                  }}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(true)
                  setValueInput(item.weightGrams)
                }}
                className="flex items-center gap-1 rounded-full border border-border/45 bg-background/45 px-2.5 py-1 text-sm text-foreground transition-all duration-200 hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                title={t("common.clickToEdit")}
                aria-label={t("common.clickToEdit")}
              >
                <span>{getMeasurementDisplay(item)}</span>
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-3">
            <NumericSliderField
              id={`food-value-${item.id}`}
              label="Adjust grams"
              value={valueInput}
              onChange={(value) => setValueInput(value)}
              min={1}
              max={1000}
              step={1}
              unit="g"
              tone="blue"
              minLabel="1 g"
              maxLabel="1000 g"
              description="Drag the grams value to fine-tune quickly, or tap it to enter an exact amount."
              className="bg-background/70"
            />
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {item.micronutrients?.fiber ? `${t("meals.fiber")}: ${formatNumber(item.micronutrients.fiber)}g` : " "}
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleFavorite ? (
              <button
                onClick={() => onToggleFavorite(item)}
                className={cn(
                  actionButtonClass,
                  isFavorite && "border-rose-500/45 bg-rose-500/18 text-rose-400"
                )}
                title={isFavorite ? t("common.removeFavorite") : t("common.addFavorite")}
                aria-label={isFavorite ? t("common.removeFavorite") : t("common.addFavorite")}
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
              </button>
            ) : null}

            {onAddToShoppingList ? (
              <button
                onClick={() => onAddToShoppingList(item)}
                className={cn(
                  actionButtonClass,
                  isInShoppingList && "border-purple-500/45 bg-purple-500/18 text-purple-400"
                )}
                title={isInShoppingList ? t("shopping.inList") : t("shopping.addToList")}
                aria-label={isInShoppingList ? t("shopping.inList") : t("shopping.addToList")}
              >
                <ShoppingCart className={cn("h-4 w-4", isInShoppingList && "fill-current")} />
              </button>
            ) : null}

            {onSwapFood ? (
              <button
                onClick={() => onSwapFood(item.id)}
                disabled={isSwapping}
                className={cn(
                  actionButtonClass,
                  isSwapping && "border-primary/45 bg-primary/18 text-primary animate-pulse"
                )}
                title={t("mealPlan.swapFood")}
                aria-label={t("mealPlan.swapFood")}
              >
                {isSwapping ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

