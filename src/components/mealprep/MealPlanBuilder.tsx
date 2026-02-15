import { Heart, Lock, LockOpen, RefreshCcw, Sparkles } from "lucide-react"
import type { MealCategory } from "@/types"
import type { MealPrepDraft, MealPrepMode } from "@/types/mealPrep"
import { computeDraftTotals, getSelectedOption } from "@/utils/mealPrepFlow"
import { GridPatternCard, GridPatternCardBody } from "@/components/ui/card-with-grid-ellipsis-pattern"
import { cn } from "@/lib/utils"

interface MealPlanBuilderProps {
  draft: MealPrepDraft
  onModeChange: (mode: MealPrepMode) => void
  onToggleMeal: (dayId: string, mealType: MealCategory) => void
  onToggleLock: (dayId: string, mealType: MealCategory) => void
  onCycleOption: (dayId: string, mealType: MealCategory) => void
  onSelectOption: (dayId: string, mealType: MealCategory, optionId: string) => void
  onTogglePantryOnly: (strict: boolean) => void
  onToggleAllowAddOns: (allow: boolean) => void
  onFavoriteMeal: (dayId: string, mealType: MealCategory) => void
  isMealFavorite: (foodItemId: string) => boolean
  onBack: () => void
  onNext: () => void
}

const mealTypeLabel: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
}

const mealOrder: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"]

const modeButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-border/50 px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"

export default function MealPlanBuilder({
  draft,
  onModeChange,
  onToggleMeal,
  onToggleLock,
  onCycleOption,
  onSelectOption,
  onTogglePantryOnly,
  onToggleAllowAddOns,
  onFavoriteMeal,
  isMealFavorite,
  onBack,
  onNext,
}: MealPlanBuilderProps) {
  const totals = computeDraftTotals(draft)

  return (
    <div className="space-y-4">
      <GridPatternCard className="border-border/55 bg-card/85">
        <GridPatternCardBody className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Meal Plan Builder</h3>
              <p className="text-sm text-muted-foreground">Choose your preferred options and lock meals before prep scheduling.</p>
            </div>
            <div className="inline-flex rounded-full border border-border/45 bg-background/35 p-1">
              {(["daily", "weekly"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all",
                    draft.mode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-sm">
              <span className="text-foreground">Strict pantry only</span>
              <input
                type="checkbox"
                checked={draft.strictPantryOnly}
                onChange={(event) => onTogglePantryOnly(event.target.checked)}
                className="h-4 w-4 rounded border-input text-primary"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-sm">
              <span className="text-foreground">Allow small add-ons</span>
              <input
                type="checkbox"
                checked={draft.allowAddOns}
                onChange={(event) => onToggleAllowAddOns(event.target.checked)}
                disabled={draft.strictPantryOnly}
                className="h-4 w-4 rounded border-input text-primary disabled:opacity-50"
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Calories</p>
              <p className="text-base font-semibold text-foreground">{totals.calories}</p>
            </div>
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="text-base font-semibold text-foreground">{totals.protein}g</p>
            </div>
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Carbs</p>
              <p className="text-base font-semibold text-foreground">{totals.carbs}g</p>
            </div>
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Fat</p>
              <p className="text-base font-semibold text-foreground">{totals.fat}g</p>
            </div>
          </div>
        </GridPatternCardBody>
      </GridPatternCard>

      <div className="space-y-4">
        {draft.days.map((day) => (
          <GridPatternCard key={day.id} className="border-border/50 bg-card/80">
            <GridPatternCardBody className="space-y-3 p-4 sm:p-5">
              <h4 className="text-base font-semibold text-foreground">{day.label}</h4>
              <div className="space-y-3">
                {mealOrder.map((mealType) => {
                  const meal = day.meals[mealType]
                  if (!meal) {
                    return null
                  }

                  const selected = getSelectedOption(meal)
                  const selectedFood = selected?.items[0]
                  const selectedFavorite = selectedFood ? isMealFavorite(selectedFood.id) : false

                  return (
                    <div key={`${day.id}-${mealType}`} className="rounded-xl border border-border/45 bg-background/35 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleMeal(day.id, mealType)}
                            className={cn(
                              "inline-flex h-5 w-5 items-center justify-center rounded border border-border/50 text-[10px] font-semibold",
                              meal.enabled ? "bg-primary/20 text-primary" : "text-muted-foreground",
                            )}
                            aria-label={`Toggle ${mealTypeLabel[mealType]} meal`}
                          >
                            {meal.enabled ? "ON" : "OFF"}
                          </button>
                          <p className="text-sm font-semibold text-foreground">{mealTypeLabel[mealType]}</p>
                          {selected ? (
                            <span className="rounded-full border border-border/40 bg-background/45 px-2 py-0.5 text-[11px] text-muted-foreground">
                              {selected.calories} kcal
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleLock(day.id, mealType)}
                            className={cn(modeButtonClass, "h-8 px-2 text-xs", meal.locked ? "text-primary" : "text-muted-foreground")}
                            aria-label={meal.locked ? "Unlock meal" : "Lock meal"}
                          >
                            {meal.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onCycleOption(day.id, mealType)}
                            disabled={meal.locked}
                            className={cn(
                              modeButtonClass,
                              "h-8 px-2 text-xs text-muted-foreground",
                              meal.locked && "cursor-not-allowed opacity-50",
                            )}
                            aria-label="Replace meal"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onFavoriteMeal(day.id, mealType)}
                            className={cn(modeButtonClass, "h-8 px-2", selectedFavorite ? "text-rose-400" : "text-muted-foreground")}
                            aria-label="Favorite selected meal"
                          >
                            <Heart className={cn("h-3.5 w-3.5", selectedFavorite && "fill-current")} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {meal.options.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelectOption(day.id, mealType, option.id)}
                            disabled={meal.locked}
                            className={cn(
                              "rounded-full border px-2 py-1 text-xs transition-all",
                              option.id === meal.selectedOptionId
                                ? "border-primary/60 bg-primary/20 text-primary"
                                : "border-border/40 bg-background/45 text-muted-foreground hover:text-foreground",
                              meal.locked && "cursor-not-allowed opacity-60",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {selected ? (
                        <div className="mt-2 rounded-lg border border-border/40 bg-background/40 p-2">
                          <p className="text-xs font-medium text-foreground">{selected.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {selected.items.map((item) => item.name).join(", ")}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Meal disabled</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </GridPatternCardBody>
          </GridPatternCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className={modeButtonClass}>
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        >
          <Sparkles className="h-4 w-4" />
          Build prep schedule
        </button>
      </div>
    </div>
  )
}
