import { useState, useEffect } from 'react';
import { useWater, WATER_PRESETS } from '../../hooks/useWater';
import { Droplets, Plus, Trophy, Trash2, Edit2 } from 'lucide-react';

interface WaterTrackerProps {
  date: string;
  onDataChange?: (data: { totalMl: number; percentage: number; goalMl: number; streak: number }) => void;
}

export default function WaterTracker({ date, onDataChange }: WaterTrackerProps) {
  const { entries, totalMl, percentage, goalMl, addWater, removeEntry, getStreak } = useWater(date);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState(250);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(250);

  const streak = getStreak();

  // Report data changes to parent
  useEffect(() => {
    onDataChange?.({ totalMl, percentage, goalMl, streak });
  }, [totalMl, percentage, goalMl, streak, onDataChange]);

  const formatAmount = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'text-green-500';
    if (percentage >= 50) return 'text-blue-500';
    return 'text-muted-foreground';
  };

  const handleEdit = (entry: typeof entries[0]) => {
    setEditingId(entry.id);
    setEditAmount(entry.amountMl);
  };

  const saveEdit = () => {
    if (editingId && editAmount > 0) {
      removeEntry(editingId);
      addWater(editAmount);
      setEditingId(null);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Water Intake</h3>
            <p className="text-xs text-muted-foreground">{formatAmount(totalMl)} / {formatAmount(goalMl)}</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Progress Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-100"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={`${percentage * 3.52} 352`}
              strokeLinecap="round"
              className={`${getProgressColor()} transition-all duration-500`}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getProgressColor()}`}>
              {percentage}%
            </span>
            <span className="text-xs text-muted-foreground">of goal</span>
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {WATER_PRESETS.map((preset) => (
          <button
            key={preset.amount}
            onClick={() => addWater(preset.amount)}
            className="flex items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Amount */}
      <div className="mb-4">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCustom ? 'Hide custom amount' : 'Add custom amount'}
        </button>
        {showCustom && (
          <div className="flex gap-2 mt-2">
            <input
              id="water-custom-amount"
              name="water-custom-amount"
              type="number"
              autoComplete="off"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Amount (ml)"
            />
            <button
              onClick={() => {
                if (customAmount > 0) {
                  addWater(customAmount);
                  setCustomAmount(250);
                  setShowCustom(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Today's Entries */}
      {entries.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground mb-2">Today's entries</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg"
              >
                <Droplets className="w-4 h-4 text-blue-500" />
                <div className="flex-1">
                  {editingId === entry.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        id={`water-edit-${entry.id}`}
                        name={`water-edit-${entry.id}`}
                        type="number"
                        autoComplete="off"
                        value={editAmount}
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-sm border border-border rounded"
                      />
                      <button
                        onClick={saveEdit}
                        className="text-xs text-blue-600 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">{formatAmount(entry.amountMl)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(entry.timestamp)}</p>
                    </>
                  )}
                </div>
                {editingId !== entry.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1 text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
