import { GridPatternCard, GridPatternCardBody } from "@/components/ui/card-with-grid-ellipsis-pattern"

interface MealPrepLandingProps {
  isOnline: boolean
  isGenerating: boolean
  hasCurrentPlan: boolean
  savedPlansCount: number
  latestPlanName?: string
  latestPlanAt?: string
  onGenerateFromPantry: () => void
  onGenerateFromAI: () => void
  onContinueCurrent: () => void
  onOpenSavedPlans: () => void
}

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-border/50 bg-background/40 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-background/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"

export default function MealPrepLanding({
  isOnline,
  isGenerating,
  hasCurrentPlan,
  savedPlansCount,
  latestPlanName,
  latestPlanAt,
  onGenerateFromPantry,
  onGenerateFromAI,
  onContinueCurrent,
  onOpenSavedPlans,
}: MealPrepLandingProps) {
  return (
    <div className="space-y-4">
      <GridPatternCard className="relative overflow-hidden border-border/55 bg-card/85">
        <GridPatternCardBody className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Meal Prep</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate a pantry-aware prep flow and turn it into a shopping-synced weekly routine.
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary">
              🍽️
            </span>
          </div>

          {!isOnline ? (
            <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              You are offline. You can still open saved meal prep plans, but plan generation is temporarily disabled.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onGenerateFromPantry}
              disabled={!isOnline || isGenerating}
              className={`${primaryButtonClass} justify-start gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Generate from Pantry
            </button>
            <button
              type="button"
              onClick={onGenerateFromAI}
              disabled={!isOnline || isGenerating}
              className={`${primaryButtonClass} justify-start gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Use AI Suggestions
            </button>
            <button
              type="button"
              onClick={onOpenSavedPlans}
              className={`${primaryButtonClass} justify-start gap-2`}
            >
              Open saved plans ({savedPlansCount})
            </button>
            <button
              type="button"
              onClick={onContinueCurrent}
              disabled={!hasCurrentPlan}
              className={`${primaryButtonClass} justify-start gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Continue last plan
            </button>
          </div>

          {latestPlanName ? (
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
              Recent saved plan: <span className="font-medium text-foreground">{latestPlanName}</span>
              {latestPlanAt ? ` • ${latestPlanAt}` : ""}
            </div>
          ) : null}
        </GridPatternCardBody>
      </GridPatternCard>
    </div>
  )
}
