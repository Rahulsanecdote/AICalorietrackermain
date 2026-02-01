import { useCallback, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';
import { WaterEntry, WATER_PRESETS } from '../types/lifestyle';
import { v4 as uuidv4 } from 'uuid';

const WATER_ENTRIES_KEY = 'act_water_entries';
const WATER_GOAL_KEY = 'act_water_goal';
const DEFAULT_GOAL = 2500; // 2.5L default daily goal

export { WATER_PRESETS };

interface UseWaterReturn {
  entries: WaterEntry[];
  totalMl: number;
  percentage: number;
  goalMl: number;
  addWater: (amountMl: number) => void;
  removeEntry: (id: string) => void;
  updateGoal: (newGoal: number) => void;
  getStreak: () => number;
}

export function useWater(date: string): UseWaterReturn {
  const [entries, setEntries] = useLocalStorage<WaterEntry[]>(WATER_ENTRIES_KEY, []);
  const [goalMl, setGoalMl] = useLocalStorage<number>(WATER_GOAL_KEY, DEFAULT_GOAL);

  // Get entries for the specific date
  const todayEntries = useMemo(() => {
    return entries.filter((entry) => entry.date === date);
  }, [entries, date]);

  // Calculate total intake for the date
  const totalMl = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.amountMl, 0);
  }, [todayEntries]);

  // Calculate percentage of goal
  const percentage = useMemo(() => {
    return Math.min(100, Math.round((totalMl / goalMl) * 100));
  }, [totalMl, goalMl]);

  // Add water intake
  const addWater = useCallback((amountMl: number) => {
    const newEntry: WaterEntry = {
      id: uuidv4(),
      date,
      amountMl,
      timestamp: Date.now(),
    };
    setEntries((prev) => [...prev, newEntry]);
  }, [date, setEntries]);

  // Remove water entry
  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setEntries]);

  // Update daily goal
  const updateGoal = useCallback((newGoal: number) => {
    setGoalMl(newGoal);
  }, [setGoalMl]);

  // Calculate streak of meeting water goal
  const getStreak = useCallback(() => {
    const sortedDates = [...new Set(entries.map((e) => e.date))].sort().reverse();
    let streak = 0;

    for (const entryDate of sortedDates) {
      const dayEntries = entries.filter((e) => e.date === entryDate);
      const dayTotal = dayEntries.reduce((sum, e) => sum + e.amountMl, 0);
      if (dayTotal >= goalMl) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [entries, goalMl]);

  return {
    entries: todayEntries,
    totalMl,
    percentage,
    goalMl,
    addWater,
    removeEntry,
    updateGoal,
    getStreak,
  };
}
