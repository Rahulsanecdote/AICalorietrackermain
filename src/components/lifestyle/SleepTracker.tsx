import React, { useState, useEffect } from 'react';
import { useSleep, formatDuration } from '../../hooks/useSleep';
import { Moon, Sun, Clock, Star, Trash2, Plus } from 'lucide-react';

interface SleepTrackerProps {
  date: string;
  onDataChange?: (data: { durationMinutes: number; qualityRating: number }) => void;
}

export default function SleepTracker({ date, onDataChange }: SleepTrackerProps) {
  const { entry, logSleep, deleteEntry, averageDuration, averageQuality } = useSleep(date);

  const [bedTime, setBedTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<3 | 1 | 2 | 4 | 5>(3);
  const [showForm, setShowForm] = useState(false);

  // Set default times to last recorded or common defaults
  useEffect(() => {
    if (entry) {
      setBedTime(entry.bedTime);
      setWakeTime(entry.wakeTime);
      setQuality(entry.qualityRating);
    }
  }, [entry]);

  // Report data changes to parent
  useEffect(() => {
    if (entry) {
      onDataChange?.({
        durationMinutes: entry.durationMinutes,
        qualityRating: entry.qualityRating
      });
    }
  }, [entry, onDataChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logSleep(bedTime, wakeTime, quality);
    setShowForm(false);
  };

  // Calculate estimated duration
  const [bedHour, bedMin] = bedTime.split(':').map(Number);
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
  let estimatedDuration = ((wakeHour || 0) * 60 + (wakeMin || 0)) - ((bedHour || 0) * 60 + (bedMin || 0));
  if (estimatedDuration < 0) estimatedDuration += 24 * 60;

  const getQualityLabel = (q: number) => {
    const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };
    return labels[q as keyof typeof labels];
  };

  const getQualityColor = (q: number) => {
    const colors = {
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-400',
      5: 'bg-green-500',
    };
    return colors[q as keyof typeof colors];
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Moon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sleep</h3>
            <p className="text-xs text-gray-500">
              {entry ? formatDuration(entry.durationMinutes) : 'Not logged'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {entry ? (
            <Clock className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Sleep Visual */}
      {entry && (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Moon className="w-4 h-4" />
                  <span className="text-xs text-white/80">Bedtime</span>
                </div>
                <p className="text-xl font-bold">{entry.bedTime}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Sun className="w-4 h-4" />
                  <span className="text-xs text-white/80">Wake</span>
                </div>
                <p className="text-xl font-bold">{entry.wakeTime}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs text-white/80">Duration</span>
                </div>
                <p className="text-xl font-bold">{formatDuration(entry.durationMinutes)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-white/80">Quality:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= entry.qualityRating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white/30'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{getQualityLabel(entry.qualityRating)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Log Sleep</h4>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="sleep-bedtime" className="block text-sm text-gray-600 mb-1">Bedtime</label>
              <input
                id="sleep-bedtime"
                name="sleep-bedtime"
                type="time"
                autoComplete="off"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="sleep-waketime" className="block text-sm text-gray-600 mb-1">Wake time</label>
              <input
                id="sleep-waketime"
                name="sleep-waketime"
                type="time"
                autoComplete="off"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Estimated Duration */}
          <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-indigo-700">Estimated duration</span>
              <span className="font-bold text-indigo-700">
                {formatDuration(estimatedDuration)}
              </span>
            </div>
          </div>

          {/* Quality Rating */}
          <div className="mb-3">
            <span className="block text-sm text-gray-600 mb-1">Sleep Quality</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQuality(star as 1 | 2 | 3 | 4 | 5)}
                  className={`flex-1 py-2 rounded-lg transition-colors ${quality === star
                      ? `${getQualityColor(star)} text-white`
                      : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'
                    }`}
                >
                  <Star
                    className={`w-5 h-5 mx-auto ${star <= quality ? 'fill-current' : ''
                      }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-1">
              {getQualityLabel(quality)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {entry && (
              <button
                type="button"
                onClick={() => {
                  deleteEntry(entry.id);
                  setShowForm(false);
                }}
                className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {entry ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Duration</p>
          <p className="font-semibold text-gray-900">
            {averageDuration > 0 ? formatDuration(averageDuration) : '--'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Quality</p>
          <div className="flex items-center justify-center gap-1">
            {averageQuality > 0 ? (
              <>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-gray-900">{averageQuality.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-gray-400">--</span>
            )}
          </div>
        </div>
      </div>

      {!entry && !showForm && (
        <div className="text-center py-8 text-gray-500">
          <Moon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No sleep logged for today</p>
          <p className="text-sm mt-1">Tap + to log your sleep</p>
        </div>
      )}
    </div>
  );
}
