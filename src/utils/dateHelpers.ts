export function createTimestampFromLocal(dateStr: string): string {
  // dateStr is expected to be "YYYY-MM-DD"
  // We construct a date that falls on this local date, preserving current time if possible.
  if (!dateStr) return new Date().toISOString()

  const now = new Date()
  const targetDate = parseDateKey(dateStr)

  targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
  return targetDate.toISOString()
}

/**
 * Formats a Date object to YYYY-MM-DD using LOCAL calendar fields.
 */
export function dateToKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD into a local Date at noon to avoid DST/UTC boundary issues.
 */
export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date()
  }
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

/**
 * Returns today's date in YYYY-MM-DD format (local time).
 */
export function getTodayStr(): string {
  return dateToKey(new Date())
}

/**
 * Convert a timestamp/string/date into a LOCAL YYYY-MM-DD date key.
 */
export function getLocalDateKeyFromTimestamp(timestamp: string | Date | number): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return getTodayStr()
  }
  return dateToKey(date)
}

/**
 * Shift a YYYY-MM-DD key by +/- N days in local time.
 */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const base = parseDateKey(dateKey)
  base.setDate(base.getDate() + deltaDays)
  return dateToKey(base)
}

export const formatDateKey = (date: Date | string) => {
  if (typeof date === "string") return date
  return dateToKey(date)
}

export function formatDate(date: string, format: string): string {
  if (!date) return ""
  const d = parseDateKey(date)

  if (format === "weekday") {
    const today = getTodayStr()
    if (date === today) return "Today"

    const yesterday = shiftDateKey(today, -1)
    if (date === yesterday) return "Yesterday"

    const tomorrow = shiftDateKey(today, 1)
    if (date === tomorrow) return "Tomorrow"

    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  }

  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
}
