import { useEffect, useMemo, useState } from "react"
import { Check, ChefHat, Lightbulb, Package, Sparkles, X } from "lucide-react"
import { GridPatternCard, GridPatternCardBody } from "@/components/ui/card-with-grid-ellipsis-pattern"
import { PantryInputData, PantryInputProps } from "../types"
import { cn } from "@/lib/utils"

const defaultData: PantryInputData = {
  breakfast: "",
  lunch: "",
  dinner: "",
  snacks: "",
}

const mealMeta: Record<
  keyof PantryInputData,
  { icon: string; title: string; accentText: string; accentBar: string; placeholder: string }
> = {
  breakfast: {
    icon: "🌅",
    title: "Breakfast Foods",
    accentText: "text-amber-300 dark:text-amber-200",
    accentBar: "bg-amber-400/75",
    placeholder: "e.g., eggs, oats, banana, milk, almonds",
  },
  lunch: {
    icon: "☀️",
    title: "Lunch Foods",
    accentText: "text-emerald-300 dark:text-emerald-200",
    accentBar: "bg-emerald-400/70",
    placeholder: "e.g., chicken breast, rice, broccoli, olive oil",
  },
  dinner: {
    icon: "🌙",
    title: "Dinner Foods",
    accentText: "text-sky-300 dark:text-sky-200",
    accentBar: "bg-sky-400/70",
    placeholder: "e.g., salmon, quinoa, spinach, avocado",
  },
  snacks: {
    icon: "🍿",
    title: "Snack Foods",
    accentText: "text-rose-300 dark:text-rose-200",
    accentBar: "bg-rose-400/70",
    placeholder: "e.g., greek yogurt, berries, protein powder (optional)",
  },
}

const fallbackSuggestions: Record<keyof PantryInputData, string[]> = {
  breakfast: ["overnight oats bowl", "egg + toast combo", "fruit + yogurt bowl"],
  lunch: ["high-protein grain bowl", "lean protein stir-fry", "rice + veggies plate"],
  dinner: ["balanced plate with protein", "fiber-rich dinner bowl", "light carb dinner mix"],
  snacks: ["protein snack cup", "fruit + nuts mini plate", "quick post-workout snack"],
}

const parseFoods = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

export default function PantryInput({ isOpen, onClose, initialData, onSave, onGeneratePlan }: PantryInputProps) {
  const [pantryData, setPantryData] = useState<PantryInputData>(initialData || defaultData)
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    setPantryData(initialData || defaultData)
  }, [initialData])

  const parsedFoods = useMemo(
    () => ({
      breakfast: parseFoods(pantryData.breakfast),
      lunch: parseFoods(pantryData.lunch),
      dinner: parseFoods(pantryData.dinner),
      snacks: parseFoods(pantryData.snacks),
    }),
    [pantryData]
  )

  if (!isOpen) {
    return null
  }

  const handleInputChange = (field: keyof PantryInputData, value: string) => {
    setPantryData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    try {
      await onGeneratePlan(pantryData)
      if (saveAsDefault) {
        await onSave(pantryData, true)
      }
      onClose()
    } catch (error) {
      console.error("Error generating meal plan:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDefault = async () => {
    await onSave(pantryData, true)
    setSaveAsDefault(false)
  }

  const hasAnyFoods = Object.values(pantryData).some((food) => food.trim().length > 0)
  const isFormValid = pantryData.breakfast.trim() && pantryData.lunch.trim() && pantryData.dinner.trim()

  return (
    <div className="fixed inset-0 z-50 bg-black/55 p-3 supports-[backdrop-filter]:backdrop-blur-sm sm:p-6">
      <div className="mx-auto flex h-[min(92vh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/45 bg-card/70 shadow-[0_24px_64px_hsl(var(--foreground)/0.34)] supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border/45 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/45 bg-primary/15 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">What foods do you have available?</h2>
              <p className="text-sm text-muted-foreground">Enter pantry foods by meal, then generate a precision plan.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/45 bg-background/35 text-muted-foreground transition-all hover:bg-background/55 hover:text-foreground"
            disabled={isGenerating}
            aria-label="Close pantry input"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
              {(Object.keys(pantryData) as Array<keyof PantryInputData>).map((mealKey) => {
                const meta = mealMeta[mealKey]
                const currentFoods = parsedFoods[mealKey]

                return (
                  <GridPatternCard key={mealKey} className="relative">
                    <span className={cn("absolute inset-x-0 top-0 h-0.5", meta.accentBar)} aria-hidden />
                    <GridPatternCardBody className="space-y-3 p-4 sm:p-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.icon}</span>
                        <h3 className={cn("text-lg font-semibold", meta.accentText)}>{meta.title}</h3>
                      </div>

                      <textarea
                        id={`pantry-${mealKey}`}
                        name={`pantry-${mealKey}`}
                        autoComplete="off"
                        value={pantryData[mealKey]}
                        onChange={(e) => handleInputChange(mealKey, e.target.value)}
                        placeholder={meta.placeholder}
                        className="min-h-[84px] w-full resize-y rounded-xl border border-border/45 bg-background/55 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-ring/60"
                        disabled={isGenerating}
                      />

                      <div className="flex flex-wrap gap-1.5">
                        {currentFoods.length > 0 ? (
                          currentFoods.slice(0, 8).map((food) => (
                            <span
                              key={`${mealKey}-${food}`}
                              className="rounded-full border border-border/40 bg-background/35 px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {food}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Separate foods with commas.</span>
                        )}
                      </div>
                    </GridPatternCardBody>
                  </GridPatternCard>
                )
              })}

              <GridPatternCard>
                <GridPatternCardBody className="space-y-3 p-4">
                  <div className="flex items-start gap-2">
                    <ChefHat className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      AI uses only your entered pantry foods, then computes portions to match your calorie goal.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="saveDefault" className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        id="saveDefault"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="h-4 w-4 rounded border-input bg-background text-primary"
                        disabled={!hasAnyFoods || isGenerating}
                      />
                      Save these foods as my default pantry
                    </label>

                    {hasAnyFoods ? (
                      <button
                        onClick={handleSaveDefault}
                        className="rounded-full border border-border/45 bg-background/35 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-background/60 hover:text-foreground"
                        disabled={isGenerating}
                      >
                        Save now
                      </button>
                    ) : null}
                  </div>
                </GridPatternCardBody>
              </GridPatternCard>
            </div>

            <div className="min-h-0 overflow-y-auto">
              <GridPatternCard className="h-full">
                <GridPatternCardBody className="flex h-full flex-col gap-4 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">AI Suggestions Preview</h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on your pantry inputs, AI will combine these foods into balanced meal cards.
                    </p>
                  </div>

                  <div className="space-y-3 overflow-y-auto pr-1">
                    {(Object.keys(parsedFoods) as Array<keyof PantryInputData>).map((mealKey) => {
                      const foods = parsedFoods[mealKey]
                      const meta = mealMeta[mealKey]
                      const candidates = foods.length > 0 ? foods : fallbackSuggestions[mealKey]

                      return (
                        <div key={`suggest-${mealKey}`} className="rounded-xl border border-border/40 bg-background/35 p-3">
                          <p className={cn("mb-2 text-sm font-medium", meta.accentText)}>
                            {meta.icon} {meta.title.replace(" Foods", "")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {candidates.slice(0, 6).map((food) => (
                              <span
                                key={`${mealKey}-chip-${food}`}
                                className="rounded-full border border-border/35 bg-background/45 px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                {food}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-xl border border-border/40 bg-background/35 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Generation tips</p>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Include at least 3-5 ingredients per meal for better macro distribution.</li>
                      <li>• Keep proteins explicit (eggs, chicken, tofu) for accurate planning.</li>
                      <li>• Add snack options if you want smoother calorie balancing.</li>
                    </ul>
                  </div>
                </GridPatternCardBody>
              </GridPatternCard>
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-end gap-3 border-t border-border/45 bg-background/50 px-4 py-3 sm:px-6"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-full border border-border/45 bg-background/35 px-4 py-2 text-muted-foreground transition-all hover:bg-background/60 hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePlan}
            disabled={!isFormValid || isGenerating}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Generating Plan...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Generate Smart Meal Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

