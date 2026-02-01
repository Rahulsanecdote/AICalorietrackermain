
import { MealPrepSuggestion } from '../../types/recipes';
import { Clock, Calendar, CheckCircle, Zap } from 'lucide-react';

interface MealPrepCardProps {
  suggestion: MealPrepSuggestion;
  onTaskComplete?: (taskIndex: number) => void;
  completedTasks?: number[];
}

export default function MealPrepCard({
  suggestion,
  onTaskComplete,
  completedTasks = [],
}: MealPrepCardProps) {
  const totalDuration = suggestion.tasks.reduce((sum, task) => sum + task.duration, 0);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h3 className="font-semibold">{suggestion.day}</h3>
          </div>
          <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-lg">
            <Clock className="w-4 h-4" />
            {totalDuration} min
          </div>
        </div>
        <p className="text-sm text-white/80 mt-1">{suggestion.description}</p>
      </div>

      {/* Tasks */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">
            Prep Tasks ({completedTasks.length}/{suggestion.tasks.length})
          </span>
        </div>

        <div className="space-y-2">
          {suggestion.tasks.map((task, index) => {
            const isCompleted = completedTasks.includes(index);

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-white border border-gray-200'
                  }`}
              >
                <button
                  onClick={() => onTaskComplete && onTaskComplete(index)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                    }`}
                >
                  {isCompleted && <CheckCircle className="w-3 h-3" />}
                </button>

                <div className="flex-1">
                  <p className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.task}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.duration} min
                    </span>
                    {task.isBatchTask && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        Batch Prep
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{
                width: `${suggestion.tasks.length > 0 ? (completedTasks.length / suggestion.tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
