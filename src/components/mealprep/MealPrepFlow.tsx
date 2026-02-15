import { useCallback, useEffect, useMemo, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Loader2, Sparkles } from "lucide-react"
import type {
  DailyMealPlan,
  MealCategory,
  MealPlanGenerationRequest,
  PantryData,
  PantryInputData,
  UserSettings,
} from "@/types"
import type { MealPrepDraft, MealPrepMode, SavedMealPrepPlan, ShoppingItemStatus } from "@/types/mealPrep"
import { createSavedPlanRecord, draftToCalendarIcs, draftToShoppingCsv, draftToSummaryText, refreshDraftArtifacts, setStrictPantryMode, switchDraftMode, createMealPrepDraft, getSelectedOption, computeDraftTotals } from "@/utils/mealPrepFlow"
import { notifyInfo, notifySuccess } from "@/utils/notifications"
import { useMealPrepPlans } from "@/hooks/useMealPrepPlans"
import MealPrepLanding from "./MealPrepLanding"
import MealPlanBuilder from "./MealPlanBuilder"
import PrepScheduleView from "./PrepScheduleView"
import ShoppingSyncView from "./ShoppingSyncView"
import SaveExportSheet from "./SaveExportSheet"
import PantryInput from "@/components/PantryInput"
import { GridPatternCard, GridPatternCardBody } from "@/components/ui/card-with-grid-ellipsis-pattern"

interface MealPrepFlowProps {
  settings: UserSettings
  currentPlan: DailyMealPlan | null
  userPantry: PantryData | null
  isGenerating: boolean
  isOnline: boolean
  onGeneratePlan: (request: MealPlanGenerationRequest) => Promise<void>
  onGeneratePlanFromPantry: (pantryData: PantryInputData) => Promise<void>
  onSavePantry: (pantryData: PantryInputData, saveAsDefault: boolean) => void
  onAddShoppingItem: (item: {
    id: string
    name: string
    category: "produce" | "dairy" | "meat" | "frozen" | "pantry" | "other"
    amount: number
    unit: string
    checked: boolean
    recipeNames: string[]
    sourceRecipeIds: string[]
  }) => void
  onToggleFoodFavorite: (item: {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    emoji?: string
  }) => void
  isFoodFavorite: (foodItemId: string) => boolean
  onTogglePlanFavorite: (plan: {
    id: string
    name: string
    calories: number
    mealCount: number
    mode: "daily" | "weekly"
  }) => void
  isPlanFavorite: (planId: string) => boolean
  onBackToTracker: () => void
}

type FlowStep = "landing" | "builder" | "schedule" | "shopping"

type PendingSource = "pantry" | "ai" | null

const normalizePantry = (pantry: PantryData | null): PantryInputData => ({
  breakfast: pantry?.breakfast ?? "",
  lunch: pantry?.lunch ?? "",
  dinner: pantry?.dinner ?? "",
  snacks: pantry?.snacks ?? "",
})

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function MealPrepFlow({
  settings,
  currentPlan,
  userPantry,
  isGenerating,
  isOnline,
  onGeneratePlan,
  onGeneratePlanFromPantry,
  onSavePantry,
  onAddShoppingItem,
  onToggleFoodFavorite,
  isFoodFavorite,
  onTogglePlanFavorite,
  isPlanFavorite,
  onBackToTracker,
}: MealPrepFlowProps) {
  const { plans, savePlan, deletePlan, latestPlan } = useMealPrepPlans()

  const [step, setStep] = useState<FlowStep>("landing")
  const [draft, setDraft] = useState<MealPrepDraft | null>(null)
  const [showPantryInput, setShowPantryInput] = useState(false)
  const [showSaveExport, setShowSaveExport] = useState(false)
  const [showSavedPlans, setShowSavedPlans] = useState(false)
  const [prepMode, setPrepMode] = useState(false)
  const [pendingSource, setPendingSource] = useState<PendingSource>(null)
  const [activeSavedPlan, setActiveSavedPlan] = useState<SavedMealPrepPlan | null>(null)

  const totals = useMemo(() => (draft ? computeDraftTotals(draft) : { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }), [draft])

  const activePlanFavorite = activeSavedPlan ? isPlanFavorite(activeSavedPlan.id) : false

  useEffect(() => {
    if (!pendingSource || isGenerating || !currentPlan) {
      return
    }

    const basePantry = currentPlan.usedPantry ?? userPantry
    const generatedDraft = refreshDraftArtifacts(createMealPrepDraft(currentPlan, basePantry ?? null, pendingSource, "daily"), basePantry ?? null)

    setDraft(generatedDraft)
    setStep("builder")
    setPendingSource(null)
    setShowPantryInput(false)
    setActiveSavedPlan(null)
    setShowSavedPlans(false)
  }, [pendingSource, isGenerating, currentPlan, userPantry])

  const updateDraft = useCallback(
    (updater: (previous: MealPrepDraft) => MealPrepDraft) => {
      setDraft((previous) => {
        if (!previous) {
          return previous
        }

        const next = updater(previous)
        const pantry = next.originalPlan?.usedPantry ?? userPantry ?? null
        return refreshDraftArtifacts(next, pantry)
      })
    },
    [userPantry],
  )

  const handleGenerateFromAI = async () => {
    if (!isOnline) {
      notifyInfo("Generation is unavailable while offline.")
      return
    }

    const request: MealPlanGenerationRequest = {
      targetCalories: settings.dailyCalorieGoal,
      goal: settings.goal || "maintain",
      activityLevel: settings.activityLevel || "moderately_active",
      dietaryPreferences: settings.dietaryPreferences || [],
    }

    setPendingSource("ai")
    await onGeneratePlan(request)
  }

  const handleGenerateFromPantry = async (pantryData: PantryInputData) => {
    setPendingSource("pantry")
    await onGeneratePlanFromPantry(pantryData)
  }

  const handleContinueCurrent = () => {
    if (!currentPlan) {
      return
    }

    const basePantry = currentPlan.usedPantry ?? userPantry
    const nextDraft = refreshDraftArtifacts(createMealPrepDraft(currentPlan, basePantry ?? null, "saved", "daily"), basePantry ?? null)
    setDraft(nextDraft)
    setStep("builder")
    setActiveSavedPlan(null)
  }

  const handleLoadSavedPlan = (saved: SavedMealPrepPlan) => {
    setDraft(saved.draft)
    setActiveSavedPlan(saved)
    setStep("builder")
    setShowSavedPlans(false)
  }

  const handleModeChange = (mode: MealPrepMode) => {
    updateDraft((previous) => switchDraftMode(previous, mode))
  }

  const handleTogglePantryOnly = (strict: boolean) => {
    updateDraft((previous) => setStrictPantryMode(previous, strict))
  }

  const handleToggleAllowAddOns = (allow: boolean) => {
    updateDraft((previous) => ({ ...previous, allowAddOns: allow, strictPantryOnly: allow ? false : previous.strictPantryOnly }))
  }

  const updateMealDraft = (
    dayId: string,
    mealType: MealCategory,
    updater: (meal: NonNullable<MealPrepDraft["days"][number]["meals"][MealCategory]>) => NonNullable<MealPrepDraft["days"][number]["meals"][MealCategory]>,
  ) => {
    updateDraft((previous) => ({
      ...previous,
      days: previous.days.map((day) => {
        if (day.id !== dayId) {
          return day
        }

        const meal = day.meals[mealType]
        if (!meal) {
          return day
        }

        return {
          ...day,
          meals: {
            ...day.meals,
            [mealType]: updater(meal),
          },
        }
      }),
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleToggleMeal = (dayId: string, mealType: MealCategory) => {
    updateMealDraft(dayId, mealType, (meal) => ({ ...meal, enabled: !meal.enabled }))
  }

  const handleToggleLock = (dayId: string, mealType: MealCategory) => {
    updateMealDraft(dayId, mealType, (meal) => ({ ...meal, locked: !meal.locked }))
  }

  const handleCycleOption = (dayId: string, mealType: MealCategory) => {
    updateMealDraft(dayId, mealType, (meal) => {
      if (meal.locked || meal.options.length === 0) {
        return meal
      }

      const currentIndex = meal.options.findIndex((option) => option.id === meal.selectedOptionId)
      const nextIndex = (currentIndex + 1) % meal.options.length
      const nextOption = meal.options[nextIndex]
      if (!nextOption) {
        return meal
      }

      return {
        ...meal,
        selectedOptionId: nextOption.id,
      }
    })
  }

  const handleSelectOption = (dayId: string, mealType: MealCategory, optionId: string) => {
    updateMealDraft(dayId, mealType, (meal) => ({ ...meal, selectedOptionId: optionId }))
  }

  const handleFavoriteMeal = (dayId: string, mealType: MealCategory) => {
    const day = draft?.days.find((entry) => entry.id === dayId)
    const meal = day?.meals[mealType]
    const selected = getSelectedOption(meal)
    const item = selected?.items[0]

    if (!item) {
      return
    }

    onToggleFoodFavorite({
      id: item.id,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      emoji: item.emoji,
    })
  }

  const handleToggleTask = (blockId: string, taskId: string) => {
    updateDraft((previous) => ({
      ...previous,
      prepBlocks: previous.prepBlocks.map((block) => {
        if (block.id !== blockId) {
          return block
        }

        return {
          ...block,
          tasks: block.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
        }
      }),
    }))
  }

  const handleSetShoppingStatus = (itemId: string, status: ShoppingItemStatus) => {
    updateDraft((previous) => ({
      ...previous,
      shopping: previous.shopping.map((item) => (item.id === itemId ? { ...item, status } : item)),
    }))
  }

  const handleSwapShoppingItem = (itemId: string, replacement: string) => {
    updateDraft((previous) => ({
      ...previous,
      shopping: previous.shopping.map((item) =>
        item.id === itemId ? { ...item, name: replacement, category: "other" } : item,
      ),
    }))
  }

  const handleRemoveShoppingItem = (itemId: string) => {
    updateDraft((previous) => ({
      ...previous,
      shopping: previous.shopping.filter((item) => item.id !== itemId),
    }))
  }

  const handleSyncToShopping = () => {
    if (!draft) {
      return
    }

    const toBuy = draft.shopping.filter((item) => item.status === "buy")
    if (toBuy.length === 0) {
      notifyInfo("Everything is already covered by your pantry.")
      return
    }

    toBuy.forEach((item) => {
      onAddShoppingItem({
        id: uuidv4(),
        name: item.name,
        category: item.category,
        amount: item.quantity,
        unit: item.unit,
        checked: false,
        recipeNames: item.sourceMeals,
        sourceRecipeIds: [],
      })
    })

    notifySuccess(`Synced ${toBuy.length} items to Shopping.`)
  }

  const buildRecord = (nameOverride?: string): SavedMealPrepPlan | null => {
    if (!draft) {
      return null
    }

    if (activeSavedPlan) {
      return {
        ...activeSavedPlan,
        name: nameOverride?.trim() || activeSavedPlan.name,
        updatedAt: new Date().toISOString(),
        draft: {
          ...draft,
          updatedAt: new Date().toISOString(),
        },
      }
    }

    return createSavedPlanRecord(draft, nameOverride)
  }

  const handleSavePlan = (name: string) => {
    const record = buildRecord(name)
    if (!record) {
      return
    }

    savePlan(record)
    setActiveSavedPlan(record)
    notifySuccess("Meal prep plan saved.")
  }

  const handleTogglePlanFavorite = (name: string) => {
    const record = buildRecord(name)
    if (!record) {
      return
    }

    if (!activeSavedPlan) {
      savePlan(record)
      setActiveSavedPlan(record)
    }

    onTogglePlanFavorite({
      id: record.id,
      name: record.name,
      calories: totals.calories,
      mealCount: totals.mealCount,
      mode: record.draft.mode,
    })
  }

  const handleCopySummary = async () => {
    const record = buildRecord()
    if (!record) {
      return
    }

    const summary = draftToSummaryText(record)
    await navigator.clipboard.writeText(summary)
    notifySuccess("Meal prep summary copied.")
  }

  const handleExportShopping = () => {
    const record = buildRecord()
    if (!record) {
      return
    }

    downloadFile(draftToShoppingCsv(record), `${record.name.replace(/\s+/g, "-").toLowerCase()}-shopping.csv`, "text/csv")
    notifySuccess("Shopping export downloaded.")
  }

  const handleExportCalendar = () => {
    const record = buildRecord()
    if (!record) {
      return
    }

    downloadFile(draftToCalendarIcs(record), `${record.name.replace(/\s+/g, "-").toLowerCase()}-prep.ics`, "text/calendar")
    notifySuccess("Prep calendar downloaded.")
  }

  const handlePrint = () => {
    const record = buildRecord()
    if (!record) {
      return
    }

    const summary = draftToSummaryText(record)
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
    if (!printWindow) {
      return
    }

    printWindow.document.write(`<html><head><title>${record.name}</title></head><body><pre style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; line-height: 1.4;">${summary}</pre></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const flowContent = (() => {
    if (step === "landing" || !draft) {
      return (
        <div className="space-y-4">
          <MealPrepLanding
            isOnline={isOnline}
            isGenerating={isGenerating}
            hasCurrentPlan={Boolean(currentPlan)}
            savedPlansCount={plans.length}
            latestPlanName={latestPlan?.name}
            latestPlanAt={latestPlan ? new Date(latestPlan.updatedAt).toLocaleString() : undefined}
            onGenerateFromPantry={() => setShowPantryInput(true)}
            onGenerateFromAI={handleGenerateFromAI}
            onContinueCurrent={handleContinueCurrent}
            onOpenSavedPlans={() => setShowSavedPlans((prev) => !prev)}
          />

          {showSavedPlans ? (
            <GridPatternCard className="border-border/50 bg-card/80">
              <GridPatternCardBody className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Saved plans</p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span aria-hidden>☰</span>
                    {plans.length}
                  </span>
                </div>

                {plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved meal prep plans yet.</p>
                ) : (
                  <div className="space-y-2">
                    {plans.slice(0, 8).map((saved) => (
                      <div key={saved.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/45 bg-background/35 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{saved.name}</p>
                          <p className="text-xs text-muted-foreground">Updated {new Date(saved.updatedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedPlan(saved)}
                            className="inline-flex min-h-9 items-center justify-center rounded-full border border-border/45 bg-background/45 px-3 text-xs text-foreground transition-all hover:bg-background/65"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePlan(saved.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/45 bg-background/45 text-muted-foreground transition-all hover:bg-background/65 hover:text-foreground"
                            aria-label={`Delete ${saved.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GridPatternCardBody>
            </GridPatternCard>
          ) : null}
        </div>
      )
    }

    if (step === "builder") {
      return (
        <MealPlanBuilder
          draft={draft}
          onModeChange={handleModeChange}
          onToggleMeal={handleToggleMeal}
          onToggleLock={handleToggleLock}
          onCycleOption={handleCycleOption}
          onSelectOption={handleSelectOption}
          onTogglePantryOnly={handleTogglePantryOnly}
          onToggleAllowAddOns={handleToggleAllowAddOns}
          onFavoriteMeal={handleFavoriteMeal}
          isMealFavorite={isFoodFavorite}
          onBack={() => setStep("landing")}
          onNext={() => setStep("schedule")}
        />
      )
    }

    if (step === "schedule") {
      return (
        <PrepScheduleView
          draft={draft}
          prepMode={prepMode}
          onTogglePrepMode={() => setPrepMode((prev) => !prev)}
          onToggleTask={handleToggleTask}
          onBack={() => setStep("builder")}
          onNext={() => setStep("shopping")}
        />
      )
    }

    return (
      <ShoppingSyncView
        draft={draft}
        onSetStatus={handleSetShoppingStatus}
        onRemoveItem={handleRemoveShoppingItem}
        onSwapItemName={handleSwapShoppingItem}
        onSyncToShopping={handleSyncToShopping}
        onBack={() => setStep("schedule")}
        onOpenSaveExport={() => setShowSaveExport(true)}
      />
    )
  })()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToTracker}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/50 bg-background/40 px-4 py-2 text-sm text-foreground transition-all hover:bg-background/60"
        >
          Back to Tracker
        </button>

        {isGenerating || pendingSource ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/35 px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating meal plan
          </span>
        ) : draft ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/35 px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {draft.mode === "weekly" ? "Weekly" : "Daily"} prep • {totals.mealCount} meals
          </span>
        ) : null}
      </div>

      {flowContent}

      <PantryInput
        isOpen={showPantryInput}
        onClose={() => setShowPantryInput(false)}
        initialData={normalizePantry(userPantry)}
        onSave={onSavePantry}
        onGeneratePlan={handleGenerateFromPantry}
      />

      <SaveExportSheet
        open={showSaveExport}
        isPlanFavorite={activePlanFavorite}
        defaultName={activeSavedPlan?.name || "Meal Prep Plan"}
        onOpenChange={setShowSaveExport}
        onSave={handleSavePlan}
        onToggleFavorite={handleTogglePlanFavorite}
        onCopySummary={handleCopySummary}
        onDownloadShopping={handleExportShopping}
        onDownloadCalendar={handleExportCalendar}
        onPrint={handlePrint}
      />
    </div>
  )
}
