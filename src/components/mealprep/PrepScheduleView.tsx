import { useMemo, useState } from "react"
import type { MealPrepDraft } from "@/types/mealPrep"
import { GridPatternCard, GridPatternCardBody } from "@/components/ui/card-with-grid-ellipsis-pattern"
import { cn } from "@/lib/utils"

interface PrepScheduleViewProps {
  draft: MealPrepDraft
  prepMode: boolean
  onTogglePrepMode: () => void
  onToggleTask: (blockId: string, taskId: string) => void
  onBack: () => void
  onNext: () => void
}

export default function PrepScheduleView({ draft, prepMode, onTogglePrepMode, onToggleTask, onBack, onNext }: PrepScheduleViewProps) {
  const [openBlockId, setOpenBlockId] = useState<string | null>(draft.prepBlocks[0]?.id ?? null)

  const completion = useMemo(() => {
    const allTasks = draft.prepBlocks.flatMap((block) => block.tasks)
    const done = allTasks.filter((task) => task.completed).length
    return {
      done,
      total: allTasks.length,
      ratio: allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0,
    }
  }, [draft.prepBlocks])

  return (
    <div className="space-y-4">
      <GridPatternCard className="border-border/55 bg-card/85">
        <GridPatternCardBody className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Prep Schedule</h3>
              <p className="text-sm text-muted-foreground">Follow structured prep blocks to finish faster with less decision fatigue.</p>
            </div>
            <button
              type="button"
              onClick={onTogglePrepMode}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                prepMode
                  ? "border-primary/55 bg-primary/20 text-primary"
                  : "border-border/45 bg-background/35 text-foreground hover:bg-background/55",
              )}
            >
              <span aria-hidden>{prepMode ? "⏹" : "▶"}</span>
              {prepMode ? "Exit prep mode" : "Start prep mode"}
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-base font-semibold text-foreground">{completion.total}</p>
            </div>
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-base font-semibold text-foreground">{completion.done}</p>
            </div>
            <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-base font-semibold text-foreground">{completion.ratio}%</p>
            </div>
          </div>
        </GridPatternCardBody>
      </GridPatternCard>

      <div className="space-y-3">
        {draft.prepBlocks.map((block) => {
          const isOpen = prepMode || openBlockId === block.id
          const blockDone = block.tasks.filter((task) => task.completed).length

          return (
            <GridPatternCard key={block.id} className="border-border/50 bg-card/80">
              <GridPatternCardBody className="space-y-3 p-4">
                <button
                  type="button"
                  onClick={() => setOpenBlockId((prev) => (prev === block.id ? null : block.id))}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{block.title}</p>
                    <p className="text-xs text-muted-foreground">{block.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border/45 bg-background/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {blockDone}/{block.tasks.length}
                    </span>
                    <span className="rounded-full border border-border/45 bg-background/40 px-2 py-0.5 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <span aria-hidden>⏱</span>
                      {block.totalMinutes} min
                    </span>
                    <span className={cn("inline-flex text-muted-foreground transition-transform", isOpen && "rotate-180")}>⌄</span>
                  </div>
                </button>

                {isOpen ? (
                  <div className="space-y-2">
                    {block.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onToggleTask(block.id, task.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition-all",
                          task.completed
                            ? "border-primary/45 bg-primary/10"
                            : "border-border/45 bg-background/35 hover:bg-background/50",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            task.completed
                              ? "border-primary/60 bg-primary/20 text-primary"
                              : "border-border/50 text-muted-foreground",
                          )}
                        >
                          ✓
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-sm", task.completed ? "text-primary" : "text-foreground")}>{task.title}</span>
                          <span className="block text-xs text-muted-foreground">{task.description}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{task.durationMinutes}m</span>
                      </button>
                    ))}
                  </div>
                ) : null}
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
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-primary/50 bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/30"
        >
          Continue to shopping sync
        </button>
      </div>
    </div>
  )
}
