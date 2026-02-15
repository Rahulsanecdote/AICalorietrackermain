import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface SaveExportSheetProps {
  open: boolean
  isPlanFavorite: boolean
  defaultName: string
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  onToggleFavorite: (name: string) => void
  onCopySummary: () => void
  onDownloadShopping: () => void
  onDownloadCalendar: () => void
  onPrint: () => void
}

const actionButtonClass =
  "inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full border border-border/50 bg-background/45 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-background/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"

export default function SaveExportSheet({
  open,
  isPlanFavorite,
  defaultName,
  onOpenChange,
  onSave,
  onToggleFavorite,
  onCopySummary,
  onDownloadShopping,
  onDownloadCalendar,
  onPrint,
}: SaveExportSheetProps) {
  const [name, setName] = useState(defaultName)

  useEffect(() => {
    if (open) {
      setName(defaultName)
    }
  }, [defaultName, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-2xl rounded-t-3xl border-border/45 bg-card/95 p-4 backdrop-blur-xl sm:rounded-3xl"
      >
        <SheetHeader>
          <SheetTitle>Save & Export Meal Prep</SheetTitle>
          <SheetDescription>
            Save this plan to your library, favorite it for quick recall, or export formats for sharing and planning.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="mealprep-name" className="text-xs font-medium text-muted-foreground">
              Plan name
            </label>
            <input
              id="mealprep-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Meal prep plan name"
              className="h-11 w-full rounded-full border border-border/50 bg-background/45 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => onSave(name)} className={actionButtonClass}>
              <span aria-hidden>💾</span>
              Save plan
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(name)}
              className={`${actionButtonClass} ${isPlanFavorite ? "border-amber-400/50 bg-amber-400/15 text-amber-200" : ""}`}
            >
              <span aria-hidden>{isPlanFavorite ? "★" : "☆"}</span>
              {isPlanFavorite ? "Unfavorite plan" : "Favorite plan"}
            </button>
            <button type="button" onClick={onCopySummary} className={actionButtonClass}>
              <span aria-hidden>⧉</span>
              Copy summary
            </button>
            <button type="button" onClick={onDownloadShopping} className={actionButtonClass}>
              <span aria-hidden>⇩</span>
              Export shopping CSV
            </button>
            <button type="button" onClick={onDownloadCalendar} className={actionButtonClass}>
              <span aria-hidden>⇩</span>
              Export prep calendar (.ics)
            </button>
            <button type="button" onClick={onPrint} className={actionButtonClass}>
              <span aria-hidden>🖨</span>
              Print plan
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
