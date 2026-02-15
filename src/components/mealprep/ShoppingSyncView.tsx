import type { MealPrepDraft, ShoppingItemStatus } from "@/types/mealPrep"
import { GridPatternCard, GridPatternCardBody } from "@/components/ui/card-with-grid-ellipsis-pattern"
import { cn } from "@/lib/utils"

interface ShoppingSyncViewProps {
  draft: MealPrepDraft
  onSetStatus: (itemId: string, status: ShoppingItemStatus) => void
  onRemoveItem: (itemId: string) => void
  onSwapItemName: (itemId: string, replacement: string) => void
  onSyncToShopping: () => void
  onBack: () => void
  onOpenSaveExport: () => void
}

const statusLabel: Record<ShoppingItemStatus, string> = {
  have: "Already have",
  buy: "Need to buy",
  optional: "Nice to have",
}

const statusTone: Record<ShoppingItemStatus, string> = {
  have: "border-emerald-400/35 bg-emerald-400/10",
  buy: "border-amber-400/35 bg-amber-400/10",
  optional: "border-sky-400/35 bg-sky-400/10",
}

export default function ShoppingSyncView({
  draft,
  onSetStatus,
  onRemoveItem,
  onSwapItemName,
  onSyncToShopping,
  onBack,
  onOpenSaveExport,
}: ShoppingSyncViewProps) {
  const grouped: Record<ShoppingItemStatus, typeof draft.shopping> = {
    have: [],
    buy: [],
    optional: [],
  }

  draft.shopping.forEach((item) => {
    grouped[item.status].push(item)
  })

  const needsToBuyCount = grouped.buy.length

  return (
    <div className="space-y-4">
      <GridPatternCard className="border-border/55 bg-card/85">
        <GridPatternCardBody className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Shopping Sync</h3>
              <p className="text-sm text-muted-foreground">Review pantry overlap, adjust swaps, then push missing items to Shopping.</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/45 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <span aria-hidden>☰</span>
              {draft.shopping.length} items
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(["have", "buy", "optional"] as ShoppingItemStatus[]).map((status) => (
              <div key={status} className={cn("rounded-xl border px-3 py-2 text-center", statusTone[status])}>
                <p className="text-xs text-muted-foreground">{statusLabel[status]}</p>
                <p className="text-base font-semibold text-foreground">{grouped[status].length}</p>
              </div>
            ))}
          </div>
        </GridPatternCardBody>
      </GridPatternCard>

      <div className="space-y-3">
        {(["buy", "have", "optional"] as ShoppingItemStatus[]).map((status) => {
          const items = grouped[status]
          if (items.length === 0) {
            return null
          }

          return (
            <GridPatternCard key={status} className="border-border/50 bg-card/80">
              <GridPatternCardBody className="space-y-2 p-4">
                <p className="text-sm font-semibold text-foreground">{statusLabel[status]}</p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/45 bg-background/35 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit} • {item.category} • {item.sourceMeals.slice(0, 2).join(" / ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const replacement = window.prompt(`Swap ${item.name} with`, item.name)
                              if (replacement && replacement.trim()) {
                                onSwapItemName(item.id, replacement.trim())
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/45 bg-background/45 text-muted-foreground transition-all hover:bg-background/65 hover:text-foreground"
                            aria-label={`Swap ${item.name}`}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/45 bg-background/45 text-muted-foreground transition-all hover:bg-background/65 hover:text-foreground"
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(["have", "buy", "optional"] as ShoppingItemStatus[]).map((nextStatus) => (
                          <button
                            key={`${item.id}-${nextStatus}`}
                            type="button"
                            onClick={() => onSetStatus(item.id, nextStatus)}
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] transition-all",
                              item.status === nextStatus
                                ? "border-primary/55 bg-primary/20 text-primary"
                                : "border-border/45 bg-background/45 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {statusLabel[nextStatus]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GridPatternCardBody>
            </GridPatternCard>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/50 bg-background/40 px-4 py-2 text-sm text-foreground transition-all hover:bg-background/60"
        >
          Back
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSyncToShopping}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/30"
          >
            <span aria-hidden>🛒</span>
            Sync {needsToBuyCount} items
          </button>
          <button
            type="button"
            onClick={onOpenSaveExport}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border/50 bg-background/40 px-4 py-2 text-sm text-foreground transition-all hover:bg-background/60"
          >
            <span aria-hidden>✓</span>
            Save / Export
          </button>
        </div>
      </div>
    </div>
  )
}
