'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { dateToKey, getTodayStr } from '../utils/dateHelpers';

type DateContextType = {
  selectedDate: string;
  currentDate: string;
  setSelectedDate: (date: string) => void;
  setCurrentDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  formatDate: (date: string, format?: 'short' | 'long' | 'weekday') => string;
};

const DATE_STORAGE_KEY = 'nutriai_selected_date';
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKey(dateKey: string): Date {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }

  // Use noon local time to avoid timezone boundary shifts.
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function isValidDateKey(dateKey: string): boolean {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return false;
  }

  const parsed = parseDateKey(dateKey);
  return !Number.isNaN(parsed.getTime());
}

function getInitialDateKey(): string {
  if (typeof window === 'undefined') {
    return getTodayStr();
  }

  const stored = window.localStorage.getItem(DATE_STORAGE_KEY);
  if (stored && isValidDateKey(stored)) {
    return stored;
  }

  return getTodayStr();
}

const initialContext: DateContextType = {
  selectedDate: getTodayStr(),
  currentDate: getTodayStr(),
  setSelectedDate: () => { },
  setCurrentDate: () => { },
  goToPreviousDay: () => { },
  goToNextDay: () => { },
  goToToday: () => { },
  formatDate: () => '',
};

const DateContext = createContext<DateContextType>(initialContext);

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDateState] = useState<string>(getInitialDateKey);

  const setSelectedDate = useCallback((date: string) => {
    if (!isValidDateKey(date)) {
      return;
    }
    setSelectedDateState(date);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DATE_STORAGE_KEY, selectedDate);
    }
  }, [selectedDate]);

  // Navigate to previous day
  const goToPreviousDay = useCallback(() => {
    setSelectedDateState((prev) => {
      const date = parseDateKey(prev);
      date.setDate(date.getDate() - 1);
      return dateToKey(date);
    });
  }, []);

  // Navigate to next day
  const goToNextDay = useCallback(() => {
    setSelectedDateState((prev) => {
      const date = parseDateKey(prev);
      date.setDate(date.getDate() + 1);
      return dateToKey(date);
    });
  }, []);

  // Reset to today
  const goToToday = useCallback(() => {
    setSelectedDateState(getTodayStr());
  }, []);

  // Format date for display
  const formatDate = useCallback((date: string, format: 'short' | 'long' | 'weekday' = 'short'): string => {
    const d = parseDateKey(date); // Use noon to avoid timezone issues

    switch (format) {
      case 'long':
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'weekday':
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      case 'short':
      default:
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
    }
  }, []);

  const value: DateContextType = {
    selectedDate,
    currentDate: selectedDate,
    setSelectedDate,
    setCurrentDate: setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    formatDate,
  };

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
}

// Custom hook to use date context
// eslint-disable-next-line react-refresh/only-export-components
export function useDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}

// export default DateContext;
