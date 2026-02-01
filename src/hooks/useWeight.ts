import { useState, useCallback, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { WeightEntry, WeightStats } from '../types/analytics';
import { v4 as uuidv4 } from 'uuid';

const WEIGHT_STORAGE_KEY = 'act_weight_history';

export function useWeight() {
  const [entries, setEntries] = useLocalStorage<WeightEntry[]>(WEIGHT_STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new weight entry
  const addEntry = useCallback((weight: number, date?: string, note?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newEntry: WeightEntry = {
        id: uuidv4(),
        date: date ?? new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
        weight,
        note,
        createdAt: new Date().toISOString(),
      };

      // Check if entry for this date already exists, update if so
      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.date === newEntry.date);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newEntry;
          return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [...prev, newEntry].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add weight entry');
    } finally {
      setIsLoading(false);
    }
  }, [setEntries]);

  // Update an existing entry
  const updateEntry = useCallback((id: string, updates: Partial<Omit<WeightEntry, 'id' | 'createdAt'>>) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      )
    );
  }, [setEntries]);

  // Delete an entry
  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setEntries]);

  // Get entries within a date range
  const getEntriesInRange = useCallback((startDate: string, endDate: string) => {
    return entries.filter(
      (entry) => entry.date >= startDate && entry.date <= endDate
    );
  }, [entries]);

  // Get the latest entry
  const getLatest = useCallback(() => {
    if (entries.length === 0) return null;
    return entries[0];
  }, [entries]);

  // Calculate statistics
  const stats = useMemo((): WeightStats | null => {
    if (entries.length === 0) return null;

    const currentWeight = entries[0]?.weight ?? 0;
    const sortedByDate = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const startWeight = sortedByDate[0]?.weight ?? 0;
    const change = currentWeight - startWeight;
    const changePercentage = startWeight > 0 ? (change / startWeight) * 100 : 0;

    // BMI calculation (assuming height from settings - will be passed in)
    const height = 175; // Default, should come from settings
    const heightM = height / 100;
    const bmi = height > 0 ? currentWeight / (heightM * heightM) : 0;

    let bmiCategory: WeightStats['bmiCategory'] = 'normal';
    if (bmi < 18.5) bmiCategory = 'underweight';
    else if (bmi < 25) bmiCategory = 'normal';
    else if (bmi < 30) bmiCategory = 'overweight';
    else bmiCategory = 'obese';

    return {
      currentWeight,
      startWeight,
      change,
      changePercentage,
      bmi: Math.round(bmi * 10) / 10,
      bmiCategory,
      totalEntries: entries.length,
    };
  }, [entries]);

  // Calculate weekly averages
  const getWeeklyAverages = useCallback(() => {
    const weeks: { [key: string]: { total: number; count: number } } = {};

    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0] ?? weekStart.toISOString();

      const entryWeek = weeks[weekKey];
      if (!entryWeek) {
        weeks[weekKey] = { total: entry.weight, count: 1 };
      } else {
        entryWeek.total += entry.weight;
        entryWeek.count += 1;
      }
    });

    return Object.entries(weeks).map(([weekStart, data]) => ({
      date: weekStart,
      average: Math.round((data.total / data.count) * 10) / 10,
      count: data.count,
    }));
  }, [entries]);

  return {
    entries,
    stats,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesInRange,
    getLatest,
    getWeeklyAverages,
    isLoading,
    error,
  };
}
