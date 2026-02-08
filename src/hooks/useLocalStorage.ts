import { useState, useCallback, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  // Initialize with initialValue to prevent hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Sync with localStorage on mount


  // Use effect to hydrate from local storage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      try {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      } catch (error) {
        console.error('Error writing to localStorage:', error);
        return prev;
      }
    });
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
