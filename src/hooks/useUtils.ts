/**
 * Utility Hooks
 * Reusable React hooks for common functionality
 */

import React, { useState, useEffect, useRef, useCallback, DependencyList } from 'react';

/**
 * Debounce hook - delays execution until after a specified wait time
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook for executing functions with delay
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  dependencies: DependencyList = []
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, delay, callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { cancel } as { cancel: () => void };
}

/**
 * localStorage hook with validation, migration, and error handling support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    validate?: (value: unknown) => boolean;
    migrate?: (value: unknown) => T;
    onError?: (error: Error) => void;
  } = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);

      if (!item) {
        return initialValue;
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(item);
      } catch {
        console.warn(`Invalid JSON in localStorage key: ${key}`);
        return initialValue;
      }

      // Run validation if provided
      if (options.validate && !options.validate(parsed)) {
        console.warn(`Validation failed for localStorage key: ${key}`);

        // Try migration if validation fails
        if (options.migrate) {
          return options.migrate(parsed);
        }

        return initialValue;
      }

      return parsed as T;
    } catch (error) {
      if (options.onError && error instanceof Error) {
        options.onError(error);
      }
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        if (options.onError && error instanceof Error) {
          options.onError(error);
        }
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, options]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      if (options.onError && error instanceof Error) {
        options.onError(error);
      }
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, options]);

  return [storedValue, setValue, removeValue];
}

/**
 * Previous value hook - tracks the previous value of a state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Interval hook - sets up an interval with proper cleanup
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Toggle hook - for boolean state that needs toggling
 */
export function useToggle(
  initialValue = false
): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  return [value, toggle];
}

/**
 * Copy to clipboard hook with automatic reset
 */
export function useCopyToClipboard(): [
  boolean,
  (text: string) => Promise<boolean>
] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopied(false);
      return false;
    }
  }, []);

  return [copied, copy];
}

/**
 * Media query hook for responsive designs
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Online status hook for detecting network connectivity
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Window size hook for responsive layouts
 */
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Click outside hook - detects clicks outside a referenced element
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

/**
 * Keyboard shortcut hook for global key event handling
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (!modifiers.ctrl || event.ctrlKey || event.metaKey) &&
        (!modifiers.shift || event.shiftKey) &&
        (!modifiers.alt || event.altKey)
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, modifiers]);
}

/**
 * Throttle hook for limiting function execution frequency
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    ((...args: unknown[]) => {
      if (Date.now() - lastRun.current >= delay) {
        lastRun.current = Date.now();
        return callback(...args);
      }
      return;
    }) as T,
    [callback, delay]
  );
}

/**
 * Local storage synchronized state with automatic parsing
 */
export function useStoredState<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? JSON.parse;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? deserialize(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const newValue = value instanceof Function ? value(state) : value;
      setState(newValue);
      try {
        localStorage.setItem(key, serialize(newValue));
      } catch (error) {
        console.error(`Error saving to localStorage:`, error);
      }
    },
    [key, state, serialize]
  );

  return [state, setValue];
}
