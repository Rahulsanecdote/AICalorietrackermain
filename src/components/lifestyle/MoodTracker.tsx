import React, { useState, useEffect } from 'react';
import { useMood, getMoodEmoji } from '../../hooks/useMood';
import { Smile, X, Trash2, Edit2, Plus } from 'lucide-react';

interface MoodTrackerProps {
  date: string;
  onDataChange?: (data: { averageScore: number; entryCount: number }) => void;
}

export default function MoodTracker({ date, onDataChange }: MoodTrackerProps) {
  const {
    entries,
    averageScore,
    logMood,
    updateEntry,
    deleteEntry,
    getWeeklyTrend,
    getMostCommonTag,
    moodTags,
  } = useMood(date);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const weeklyTrend = getWeeklyTrend();
  const mostCommonTag = getMostCommonTag();

  // Report data changes to parent
  useEffect(() => {
    onDataChange?.({ averageScore, entryCount: entries.length });
  }, [averageScore, entries.length, onDataChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScore) {
      if (editingId) {
        saveEdit();
      } else {
        logMood(selectedScore, selectedTags, note || undefined);
        resetForm();
      }
    }
  };

  const handleEdit = (entry: typeof entries[0]) => {
    setEditingId(entry.id);
    setSelectedScore(entry.score as 1 | 2 | 3 | 4 | 5);
    setSelectedTags(entry.tags);
    setNote(entry.note || '');
  };

  const saveEdit = () => {
    if (editingId && selectedScore) {
      updateEntry(editingId, {
        score: selectedScore,
        tags: selectedTags,
        note: note || undefined,
      });
      setEditingId(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedScore(null);
    setSelectedTags([]);
    setNote('');
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const getMoodLabel = (score: number) => {
    const labels = { 1: 'Terrible', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great' };
    return labels[score as keyof typeof labels];
  };

  const moodOptions = [
    { score: 1, emoji: '😢', label: 'Terrible', color: 'bg-red-500' },
    { score: 2, emoji: '😔', label: 'Bad', color: 'bg-orange-400' },
    { score: 3, emoji: '😐', label: 'Okay', color: 'bg-yellow-400' },
    { score: 4, emoji: '🙂', label: 'Good', color: 'bg-green-400' },
    { score: 5, emoji: '😊', label: 'Great', color: 'bg-green-500' },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smile className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Mood</h3>
            <p className="text-xs text-muted-foreground">
              {averageScore > 0 ? `${averageScore}/5 average` : 'Not logged'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Mood Display */}
      {entries.length > 0 && (
        <div className="mb-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-4xl mb-1">
                {getMoodEmoji(Math.round(averageScore))}
              </p>
              <p className="text-2xl font-bold">{averageScore}</p>
              <p className="text-xs text-white/80">Today's Average</p>
            </div>
          </div>
          {mostCommonTag && (
            <div className="mt-3 pt-3 border-t border-white/20 text-center">
              <p className="text-sm text-white/90">
                Feeling: <strong>{mostCommonTag}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Weekly Trend */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Weekly Trend</p>
        <div className="flex items-end justify-between h-12 gap-1">
          {weeklyTrend.map((score, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t ${score > 0 ? 'bg-green-400' : 'bg-accent'
                  }`}
                style={{
                  height: `${score > 0 ? score * 20 : 4}px`,
                  maxHeight: '48px',
                }}
              />
              <span className="text-xs text-muted-foreground mt-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mood Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">How are you feeling?</h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mood Selection */}
          <div className="flex justify-between mb-4">
            {moodOptions.map((option) => (
              <button
                key={option.score}
                type="button"
                onClick={() => setSelectedScore(option.score as 1 | 2 | 3 | 4 | 5)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${selectedScore === option.score
                  ? `${option.color} text-white scale-110`
                  : 'bg-card border border-border hover:bg-accent'
                  }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="mb-3">
            <span className="block text-sm text-muted-foreground mb-1">Tags (optional)</span>
            <div className="flex flex-wrap gap-1">
              {moodTags.slice(0, 6).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`px-2 py-1 rounded-full text-xs transition-colors ${selectedTags.includes(tag.name)
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-card border border-border text-muted-foreground hover:bg-card'
                    }`}
                >
                  {tag.emoji} {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="mb-3">
            <label htmlFor="mood-note" className="block text-sm text-muted-foreground mb-1">Note (optional)</label>
            <textarea
              id="mood-note"
              name="mood-note"
              autoComplete="off"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-green-500 resize-none"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={!selectedScore}
            className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Log Mood
          </button>
        </form>
      )}

      {/* Today's Entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.slice(0, 3).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-2 bg-card rounded-lg"
            >
              <span className="text-xl">{getMoodEmoji(entry.score)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {getMoodLabel(entry.score)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {entry.tags.length > 0 && (
                <div className="flex gap-1">
                  {entry.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(entry)}
                  className="p-1 text-muted-foreground hover:text-blue-500 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
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
          <Smile className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No mood logged today</p>
          <p className="text-sm mt-1">Tap + to log how you're feeling</p>
        </div>
      )}
    </div>
  );
}
