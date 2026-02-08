import { useCallback, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';
import { MoodEntry } from '../types/lifestyle';
import { MOOD_TAGS } from '../types/lifestyle';
import { v4 as uuidv4 } from 'uuid';
import { dateToKey } from '../utils/dateHelpers';

const MOOD_ENTRIES_KEY = 'act_mood_entries';

interface UseMoodReturn {
  entries: MoodEntry[];
  averageScore: number;
  logMood: (score: MoodEntry['score'], tags?: string[], note?: string) => void;
  updateEntry: (id: string, updates: Partial<MoodEntry>) => void;
  deleteEntry: (id: string) => void;
  getWeeklyTrend: () => number[]; // Array of daily averages
  getMostCommonTag: () => string | null;
  moodTags: typeof MOOD_TAGS;
}

export function useMood(date: string): UseMoodReturn {
  const [entries, setEntries] = useLocalStorage<MoodEntry[]>(MOOD_ENTRIES_KEY, []);

  // Get entries for the specific date
  const todayEntries = useMemo(() => {
    return entries.filter((entry) => entry.date === date);
  }, [entries, date]);

  // Calculate average mood score for the day
  const averageScore = useMemo(() => {
    if (todayEntries.length === 0) return 0;
    const total = todayEntries.reduce((sum, e) => sum + e.score, 0);
    return Number((total / todayEntries.length).toFixed(1));
  }, [todayEntries]);

  // Log mood
  const logMood = useCallback(
    (score: MoodEntry['score'], tags: string[] = [], note?: string) => {
      const newEntry: MoodEntry = {
        id: uuidv4(),
        date,
        score,
        tags,
        note,
        timestamp: Date.now(),
      };
      setEntries((prev) => [...prev, newEntry]);
    },
    [date, setEntries]
  );

  // Update an entry
  const updateEntry = useCallback(
    (id: string, updates: Partial<MoodEntry>) => {
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

  // Get weekly trend (last 7 days of daily averages)
  const getWeeklyTrend = useCallback(() => {
    const trend: number[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = dateToKey(date);

      const dayEntries = entries.filter((e) => e.date === dateStr);
      if (dayEntries.length === 0) {
        trend.push(0); // No entry for this day
      } else {
        const dayAverage = dayEntries.reduce((sum, e) => sum + e.score, 0) / dayEntries.length;
        trend.push(Number(dayAverage.toFixed(1)));
      }
    }

    return trend;
  }, [entries]);

  // Get most common tag across all entries
  const getMostCommonTag = useCallback(() => {
    const tagCounts: Record<string, number> = {};

    entries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    let mostCommon: string | null = null;
    let maxCount = 0;

    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = tag;
      }
    });

    return mostCommon;
  }, [entries]);

  return {
    entries: todayEntries,
    averageScore,
    logMood,
    updateEntry,
    deleteEntry,
    getWeeklyTrend,
    getMostCommonTag,
    moodTags: MOOD_TAGS,
  };
}

// Helper to get emoji for mood score
export function getMoodEmoji(score: number): string {
  const emojis: Record<number, string> = {
    1: '😢',
    2: '😔',
    3: '😐',
    4: '🙂',
    5: '😊',
  };
  return emojis[score] || '😐';
}

// Helper to get color for mood score
export function getMoodColor(score: number): string {
  if (score <= 2) return 'text-red-500';
  if (score === 3) return 'text-yellow-500';
  return 'text-green-500';
}
