import { useCallback, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';
import { SleepEntry } from '../types/lifestyle';
import { v4 as uuidv4 } from 'uuid';

const SLEEP_ENTRIES_KEY = 'act_sleep_entries';

interface UseSleepReturn {
  entry: SleepEntry | null;
  averageDuration: number;
  averageQuality: number;
  logSleep: (bedTime: string, wakeTime: string, quality: SleepEntry['qualityRating'], notes?: string) => void;
  updateEntry: (id: string, updates: Partial<SleepEntry>) => void;
  deleteEntry: (id: string) => void;
  getWeeklyStats: () => { avgDuration: number; avgQuality: number };
}

export function useSleep(date: string): UseSleepReturn {
  const [entries, setEntries] = useLocalStorage<SleepEntry[]>(SLEEP_ENTRIES_KEY, []);

  // Get entry for the specific date (morning date)
  const todayEntry = useMemo(() => {
    return entries.find((entry) => entry.date === date) || null;
  }, [entries, date]);

  // Calculate averages from all entries
  const averages = useMemo(() => {
    if (entries.length === 0) return { duration: 0, quality: 0 };

    const totalDuration = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const totalQuality = entries.reduce((sum, e) => sum + e.qualityRating, 0);

    return {
      duration: Math.round(totalDuration / entries.length),
      quality: Number((totalQuality / entries.length).toFixed(1)),
    };
  }, [entries]);

  // Log sleep
  const logSleep = useCallback(
    (bedTime: string, wakeTime: string, quality: SleepEntry['qualityRating'], notes?: string) => {
      // Calculate duration
      const [bedHour = 0, bedMin = 0] = bedTime.split(':').map(Number);
      const [wakeHour = 0, wakeMin = 0] = wakeTime.split(':').map(Number);

      let durationMinutes = (wakeHour * 60 + wakeMin) - (bedHour * 60 + bedMin);

      // Handle case where wake time is next day
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours
      }

      const newEntry: SleepEntry = {
        id: uuidv4(),
        date,
        bedTime,
        wakeTime,
        durationMinutes,
        qualityRating: quality,
        notes,
        timestamp: Date.now(),
      };

      // Remove existing entry for this date and add new one
      setEntries((prev) => [...prev.filter((e) => e.date !== date), newEntry]);
    },
    [date, setEntries]
  );

  // Update an entry
  const updateEntry = useCallback(
    (id: string, updates: Partial<SleepEntry>) => {
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
      );
    },
    [setEntries]
  );

  // Delete an entry
  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    },
    [setEntries]
  );

  // Get weekly statistics
  const getWeeklyStats = useCallback(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo && entryDate <= today;
    });

    if (weekEntries.length === 0) return { avgDuration: 0, avgQuality: 0 };

    const avgDuration = Math.round(
      weekEntries.reduce((sum, e) => sum + e.durationMinutes, 0) / weekEntries.length
    );
    const avgQuality =
      weekEntries.reduce((sum, e) => sum + e.qualityRating, 0) / weekEntries.length;

    return { avgDuration, avgQuality: Number(avgQuality.toFixed(1)) };
  }, [entries]);

  return {
    entry: todayEntry,
    averageDuration: averages.duration,
    averageQuality: averages.quality,
    logSleep,
    updateEntry,
    deleteEntry,
    getWeeklyStats,
  };
}

// Helper to format duration for display
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
