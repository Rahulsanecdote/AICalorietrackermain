import { useState, useCallback, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';
import { ExerciseEntry, ExerciseType } from '../types/lifestyle';
import { EXERCISE_TYPES } from '../types/lifestyle';
import { v4 as uuidv4 } from 'uuid';

const EXERCISE_ENTRIES_KEY = 'act_exercise_entries';

interface UseExerciseReturn {
  entries: ExerciseEntry[];
  totalMinutes: number;
  totalCaloriesBurned: number;
  logWorkout: (workout: Omit<ExerciseEntry, 'id' | 'timestamp'>) => void;
  updateWorkout: (id: string, updates: Partial<ExerciseEntry>) => void;
  deleteWorkout: (id: string) => void;
  getWeeklyStats: () => { totalMinutes: number; totalCalories: number };
  exerciseTypes: typeof EXERCISE_TYPES;
}

export function useExercise(date: string, weightKg: number = 70): UseExerciseReturn {
  const [entries, setEntries] = useLocalStorage<ExerciseEntry[]>(EXERCISE_ENTRIES_KEY, []);

  // Get entries for the specific date
  const todayEntries = useMemo(() => {
    return entries.filter((entry) => entry.date === date);
  }, [entries, date]);

  // Calculate totals
  const totalMinutes = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  }, [todayEntries]);

  const totalCaloriesBurned = useMemo(() => {
    return todayEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
  }, [todayEntries]);

  // Log a new workout
  const logWorkout = useCallback((workout: Omit<ExerciseEntry, 'id' | 'timestamp'>) => {
    const newEntry: ExerciseEntry = {
      ...workout,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    setEntries((prev) => [...prev, newEntry]);
  }, [setEntries]);

  // Update an existing workout
  const updateWorkout = useCallback((id: string, updates: Partial<ExerciseEntry>) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  }, [setEntries]);

  // Delete a workout
  const deleteWorkout = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setEntries]);

  // Get weekly statistics
  const getWeeklyStats = useCallback(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo && entryDate <= today;
    });

    return {
      totalMinutes: weekEntries.reduce((sum, e) => sum + e.durationMinutes, 0),
      totalCalories: weekEntries.reduce((sum, e) => sum + e.caloriesBurned, 0),
    };
  }, [entries]);

  return {
    entries: todayEntries,
    totalMinutes,
    totalCaloriesBurned,
    logWorkout,
    updateWorkout,
    deleteWorkout,
    getWeeklyStats,
    exerciseTypes: EXERCISE_TYPES,
  };
}

// Helper function to calculate calories burned
export function calculateCaloriesBurned(
  exerciseType: ExerciseType,
  durationMinutes: number,
  weightKg: number
): number {
  // Base calculation: calories per minute * duration * weight factor
  // This is a simplified MET-based calculation
  const weightFactor = weightKg / 70; // Normalize to 70kg
  const caloriesPerMinute = exerciseType.caloriesPerMinute * weightFactor;
  return Math.round(caloriesPerMinute * durationMinutes);
}
