export function createTimestampFromLocal(dateStr: string): string {
    // dateStr is expected to be "YYYY-MM-DD"
    // We construct a date that falls on this local date, preserving current time if possible.

    if (!dateStr) return new Date().toISOString();

    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);

    // Create date object using local components
    // Note: Month is 0-indexed in JS Date
    const targetDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

    return targetDate.toISOString();
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function dateToKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns today's date in YYYY-MM-DD format (local time)
 */
export function getTodayStr(): string {
    return dateToKey(new Date());
}

export const formatDateKey = (date: Date | string) => {
    if (typeof date === 'string') return date;
    return dateToKey(date);
};

export function formatDate(date: string, format: string): string {
    if (!date) return "";
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);

    if (format === "weekday") {
        const today = getTodayStr();
        if (date === today) return "Today";

        // Check yesterday
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
        if (date === yesterday) return "Yesterday";

        // Check tomorrow
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
        if (date === tomorrow) return "Tomorrow";

        return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    }

    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
