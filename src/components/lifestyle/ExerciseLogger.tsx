import React, { useState, useEffect } from 'react';
import { useExercise } from '../../hooks/useExercise';
import { calculateCaloriesBurned } from '../../hooks/useExercise';
import { Flame, Plus, Trash2, Timer, X } from 'lucide-react';
import NumericSliderField from '../ui/NumericSliderField';

interface ExerciseLoggerProps {
  date: string;
  weightKg?: number;
  onDataChange?: (data: { totalMinutes: number; totalCaloriesBurned: number }) => void;
}

export default function ExerciseLogger({ date, weightKg = 70, onDataChange }: ExerciseLoggerProps) {
  const {
    entries,
    totalMinutes,
    totalCaloriesBurned,
    logWorkout,
    deleteWorkout,
    exerciseTypes,
  } = useExercise(date, weightKg);

  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(exerciseTypes[0]);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  // Report data changes to parent
  useEffect(() => {
    onDataChange?.({ totalMinutes, totalCaloriesBurned });
  }, [totalMinutes, totalCaloriesBurned, onDataChange]);

  const estimatedCalories = selectedType ? calculateCaloriesBurned(selectedType, duration, weightKg) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logWorkout({
      date,
      type: selectedType?.name || "Exercise",
      durationMinutes: duration,
      caloriesBurned: estimatedCalories,
      intensity,
      notes: notes || undefined,
    });
    resetForm();
  };





  const resetForm = () => {
    setShowForm(false);
    setDuration(30);
    setNotes('');
    setSelectedType(exerciseTypes[0]);
  };



  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-destructive/20 rounded-lg">
            <Flame className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Exercise</h3>
            <p className="text-xs text-muted-foreground">
              {totalMinutes} min • {totalCaloriesBurned} cal burned
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalCaloriesBurned}</p>
            <p className="text-xs text-white/80">Calories Burned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{totalMinutes}</p>
            <p className="text-xs text-white/80">Minutes Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-white/80">Workouts</p>
          </div>
        </div>
      </div>

      {/* Workout Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Log Workout</h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Exercise Type */}
          <div className="mb-3">
            <span className="block text-sm text-muted-foreground mb-1">Type</span>
            <div className="grid grid-cols-5 gap-1">
              {exerciseTypes.slice(0, 5).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-2 rounded-lg text-center transition-colors ${selectedType?.id === type.id
                    ? 'bg-destructive/20 border-2 border-red-500'
                    : 'bg-card border border-border hover:bg-accent'
                    }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <p className="text-xs truncate">{type.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <NumericSliderField
            id="exercise-duration"
            label="Duration"
            value={duration}
            min={5}
            max={180}
            step={5}
            unit="min"
            tone="red"
            minLabel="5 min"
            maxLabel="180 min"
            description="Drag the duration value for quick tuning, or tap it to enter an exact number."
            onChange={(value) => setDuration(value)}
            className="mb-3"
          />

          {/* Estimated Calories */}
          <div className="mb-3 p-3 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated burn</span>
              <span className="font-bold text-destructive">~{estimatedCalories} cal</span>
            </div>
          </div>

          {/* Intensity */}
          <div className="mb-3">
            <span className="block text-sm text-muted-foreground mb-1">Intensity</span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setIntensity(level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${intensity === level
                    ? level === 'low'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : level === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                        : 'bg-destructive/20 text-destructive border-2 border-red-500'
                    : 'bg-card border border-border text-muted-foreground'
                    }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label htmlFor="exercise-notes" className="block text-sm text-muted-foreground mb-1">Notes (optional)</label>
            <input
              id="exercise-notes"
              name="exercise-notes"
              type="text"
              autoComplete="off"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go?"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Save Workout
            </button>
          </div>
        </form>
      )}

      {/* Today's Workouts */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 bg-card rounded-lg"
            >
              <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{entry.type}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {entry.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {entry.caloriesBurned} cal
                  </span>
                  <span className="capitalize">{entry.intensity}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => deleteWorkout(entry.id)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-8 text-muted-foreground">
          <Flame className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No workouts logged today</p>
          <p className="text-sm mt-1">Tap + to log your first workout</p>
        </div>
      )}
    </div>
  );
}
