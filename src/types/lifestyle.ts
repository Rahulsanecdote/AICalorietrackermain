// Water Intake Types
export interface WaterEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: number;
}

export interface WaterGoal {
  dailyGoal: number; // default 2500ml
}

// Exercise Logging Types
export type ExerciseIntensity = 'low' | 'medium' | 'high';

export interface ExerciseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: ExerciseIntensity;
  notes?: string;
  timestamp: number;
}

export interface ExerciseType {
  id: string;
  name: string;
  icon: string;
  caloriesPerMinute: number; // MET-based approximation
}

// Sleep Tracking Types
export interface SleepEntry {
  id: string;
  date: string; // The morning date (when user woke up)
  bedTime: string; // HH:mm format
  wakeTime: string; // HH:mm format
  durationMinutes: number;
  qualityRating: 1 | 2 | 3 | 4 | 5; // 1=Poor, 5=Excellent
  notes?: string;
  timestamp: number;
}

// Mood Tracking Types
export type MoodScore = 1 | 2 | 3 | 4 | 5; // 1=Terrible, 5=Great

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  score: MoodScore;
  tags: string[]; // e.g., ["Stressed", "Energetic", "Tired"]
  note?: string;
  timestamp: number;
}

export interface MoodTag {
  id: string;
  name: string;
  emoji: string;
}

// Lifestyle Summary for Dashboard
export interface LifestyleSummary {
  date: string;
  water: {
    totalMl: number;
    goalMl: number;
    percentage: number;
    entries: WaterEntry[];
  };
  exercise: {
    totalMinutes: number;
    totalCaloriesBurned: number;
    entries: ExerciseEntry[];
  };
  sleep: {
    averageDuration: number;
    averageQuality: number;
    entries: SleepEntry[];
  };
  mood: {
    averageScore: number;
    entries: MoodEntry[];
    dominantTag?: string;
  };
}

// Quick add presets
export const WATER_PRESETS = [
  { amount: 100, label: '100ml' },
  { amount: 250, label: '250ml' },
  { amount: 500, label: '500ml' },
];

export const EXERCISE_TYPES: ExerciseType[] = [
  { id: 'walking', name: 'Walking', icon: '🚶', caloriesPerMinute: 4 },
  { id: 'running', name: 'Running', icon: '🏃', caloriesPerMinute: 10 },
  { id: 'cycling', name: 'Cycling', icon: '🚴', caloriesPerMinute: 8 },
  { id: 'swimming', name: 'Swimming', icon: '🏊', caloriesPerMinute: 10 },
  { id: 'yoga', name: 'Yoga', icon: '🧘', caloriesPerMinute: 4 },
  { id: 'hiit', name: 'HIIT', icon: '💪', caloriesPerMinute: 12 },
  { id: 'weights', name: 'Weight Training', icon: '🏋️', caloriesPerMinute: 6 },
  { id: 'pilates', name: 'Pilates', icon: '🤸', caloriesPerMinute: 5 },
  { id: 'dance', name: 'Dance', icon: '💃', caloriesPerMinute: 7 },
  { id: 'other', name: 'Other', icon: '⚡', caloriesPerMinute: 5 },
];

export const MOOD_TAGS: MoodTag[] = [
  { id: 'energetic', name: 'Energetic', emoji: '⚡' },
  { id: 'tired', name: 'Tired', emoji: '😴' },
  { id: 'stressed', name: 'Stressed', emoji: '😰' },
  { id: 'relaxed', name: 'Relaxed', emoji: '😌' },
  { id: 'happy', name: 'Happy', emoji: '😊' },
  { id: 'sad', name: 'Sad', emoji: '😢' },
  { id: 'motivated', name: 'Motivated', emoji: '🔥' },
  { id: 'lazy', name: 'Lazy', emoji: '🛋️' },
  { id: 'focused', name: 'Focused', emoji: '🎯' },
  { id: 'distracted', name: 'Distracted', emoji: '🤯' },
];

// Combined Lifestyle Entry type for export/import
export type LifestyleEntry = WaterEntry | ExerciseEntry | SleepEntry | MoodEntry;
