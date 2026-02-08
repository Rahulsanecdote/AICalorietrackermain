"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { DayPicker } from "react-day-picker"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "../lib/utils"
import { dateToKey, getTodayStr } from "../utils/dateHelpers"
import { useIsMobile } from "../hooks/use-mobile"

interface TrackerDatePickerProps {
  selectedDate: string
  onDateChange: (date: string) => void
  isLoading?: boolean
  className?: string
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseDateKey(dateKey: string): Date {
  const [yearStr, monthStr, dayStr] = dateKey.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date()
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function getSafeDateKey(dateKey: string): string {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return getTodayStr()
  }
  return dateKey
}

function formatCompactDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function shiftDate(dateKey: string, deltaDays: number): string {
  const next = parseDateKey(dateKey)
  next.setDate(next.getDate() + deltaDays)
  return dateToKey(next)
}

export default function TrackerDatePicker({
  selectedDate,
  onDateChange,
  isLoading = false,
  className,
}: TrackerDatePickerProps) {
  const isMobile = useIsMobile()
  const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const desktopTriggerRef = useRef<HTMLButtonElement | null>(null)
  const desktopPopoverRef = useRef<HTMLDivElement | null>(null)

  const safeDateKey = getSafeDateKey(selectedDate)
  const selectedDateObject = useMemo(() => parseDateKey(safeDateKey), [safeDateKey])
  const todayDateKey = getTodayStr()
  const isToday = safeDateKey === todayDateKey

  const closePicker = () => {
    setIsDesktopPopoverOpen(false)
    setIsMobileSheetOpen(false)
  }

  const updateDate = (nextDate: string) => {
    onDateChange(getSafeDateKey(nextDate))
  }

  const handleCalendarSelect = (date?: Date) => {
    if (!date) {
      return
    }
    updateDate(dateToKey(date))
    closePicker()
  }

  const handleGoToToday = () => {
    updateDate(todayDateKey)
    closePicker()
  }

  const handleClear = () => {
    updateDate(todayDateKey)
    closePicker()
  }

  useEffect(() => {
    if (!isDesktopPopoverOpen || isMobile) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (desktopPopoverRef.current?.contains(target) || desktopTriggerRef.current?.contains(target)) {
        return
      }
      setIsDesktopPopoverOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDesktopPopoverOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isDesktopPopoverOpen, isMobile])

  const pickerPanel = (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-accent/30 p-3">
        <p className="text-xs text-muted-foreground">Selected date</p>
        <p className="text-sm font-semibold text-foreground">{formatLongDate(selectedDateObject)}</p>
      </div>

      <DayPicker
        mode="single"
        selected={selectedDateObject}
        month={selectedDateObject}
        onSelect={handleCalendarSelect}
        showOutsideDays
        className="mx-auto"
        classNames={{
          months: "flex flex-col",
          month: "space-y-3",
          caption: "flex items-center justify-center pt-1 relative",
          caption_label: "text-sm font-semibold text-foreground",
          nav: "flex items-center gap-1",
          nav_button:
            "h-8 w-8 inline-flex items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "w-9 text-[0.78rem] text-muted-foreground font-medium",
          row: "mt-1 flex w-full",
          cell: "h-9 w-9 p-0 text-center text-sm",
          day:
            "h-9 w-9 rounded-md p-0 text-sm font-normal text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary",
          day_today: "border border-primary/50 font-semibold",
          day_outside: "text-muted-foreground/50",
          day_disabled: "text-muted-foreground/40",
          day_hidden: "invisible",
        }}
      />

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          aria-label="Clear selection and return to today"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleGoToToday}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          aria-label="Jump to today"
        >
          Today
        </button>
        <button
          type="button"
          onClick={closePicker}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          aria-label="Close date picker"
        >
          Close
        </button>
      </div>
    </div>
  )

  return (
    <div className={cn("rounded-xl border border-border bg-card p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => updateDate(shiftDate(safeDateKey, -1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Go to previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          {isMobile ? (
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open calendar. Selected date ${formatLongDate(selectedDateObject)}`}
              aria-haspopup="dialog"
              aria-expanded={isMobileSheetOpen}
            >
              <span>{formatCompactDate(selectedDateObject)}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="relative inline-flex">
              <button
                ref={desktopTriggerRef}
                type="button"
                onClick={() => setIsDesktopPopoverOpen((previous) => !previous)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Open calendar. Selected date ${formatLongDate(selectedDateObject)}`}
                aria-haspopup="dialog"
                aria-expanded={isDesktopPopoverOpen}
                aria-controls="tracker-date-picker-popover"
              >
                <span>{formatCompactDate(selectedDateObject)}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isDesktopPopoverOpen && (
                <div
                  ref={desktopPopoverRef}
                  id="tracker-date-picker-popover"
                  role="dialog"
                  aria-label="Select date"
                  className="absolute left-1/2 top-[calc(100%+8px)] z-[60] w-[340px] -translate-x-1/2 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none"
                >
                  {pickerPanel}
                </div>
              )}
            </div>
          )}

          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {isLoading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading meals...
              </span>
            ) : isToday ? (
              "Today"
            ) : (
              formatLongDate(selectedDateObject)
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleGoToToday}
            className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isToday}
            aria-label="Jump to today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => updateDate(shiftDate(safeDateKey, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Go to next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isMobile && (
        <DialogPrimitive.Root open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[59] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full"
              aria-describedby="tracker-date-picker-description"
            >
              <DialogPrimitive.Title className="sr-only">Select date</DialogPrimitive.Title>
              <DialogPrimitive.Description id="tracker-date-picker-description" className="sr-only">
                Pick a day to update the meal log list.
              </DialogPrimitive.Description>
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
              {pickerPanel}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </div>
  )
}
