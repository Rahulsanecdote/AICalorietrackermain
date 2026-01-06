import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateNavigatorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
}

export default function DateNavigator({ currentDate, onDateChange }: DateNavigatorProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  const goToPreviousDay = () => {
    const date = new Date(currentDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    onDateChange(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(currentDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    onDateChange(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousDay}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-gray-900">
            {formatDate(currentDate)}
          </span>
          {!isToday && (
            <button
              onClick={goToToday}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 bg-emerald-50 rounded-full"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextDay}
          disabled={isToday}
          className={`p-2 rounded-full transition-colors ${
            isToday
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-100'
          }`}
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
