'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type DateContextType = {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  formatDate: (date: string, format?: 'short' | 'long' | 'weekday') => string;
};

const initialContext: DateContextType = {
  currentDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
  setCurrentDate: () => { },
  goToPreviousDay: () => { },
  goToNextDay: () => { },
  goToToday: () => { },
  formatDate: () => '',
};

const DateContext = createContext<DateContextType>(initialContext);

export function DateProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0] ?? new Date().toISOString()
  );

  // Navigate to previous day
  const goToPreviousDay = useCallback(() => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      date.setDate(date.getDate() - 1);
      return date.toISOString().split('T')[0] ?? date.toISOString();
    });
  }, []);

  // Navigate to next day
  const goToNextDay = useCallback(() => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0] ?? date.toISOString();
    });
  }, []);

  // Reset to today
  const goToToday = useCallback(() => {
    setCurrentDate(new Date().toISOString().split('T')[0] ?? new Date().toISOString());
  }, []);

  // Format date for display
  const formatDate = useCallback((date: string, format: 'short' | 'long' | 'weekday' = 'short'): string => {
    const d = new Date(date + 'T12:00:00'); // Use noon to avoid timezone issues

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
    currentDate,
    setCurrentDate,
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
export function useDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}

export default DateContext;
