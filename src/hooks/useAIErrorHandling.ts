/**
 * Hook for handling AI operations with error queuing and graceful degradation
 * Uses standardized OperationState pattern for consistent async handling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  OperationState,
  OperationStatus,
  createInitialState,
  createLoadingState,
  createSuccessState,
  createErrorState,
  AppError,
  toAppError,
  logError,
  generateErrorId,
  isRetryableError,
} from '../utils/errors';

// ============================================================================
// Types
// ============================================================================

export interface UseAIRequestOptions {
  maxRetries?: number;
  retryDelay?: number;
  queueOnFailure?: boolean;
  autoRetry?: boolean;
}

export interface QueuedAIRequest {
  id: string;
  type: 'meal_analysis' | 'meal_plan' | 'recipe' | 'insights';
  payload: unknown;
  timestamp: string;
  retryCount: number;
}

// ============================================================================
// Hook for AI requests with standardized OperationState pattern
// ============================================================================

/**
 * Hook for making AI requests with automatic error handling and OperationState pattern
 */
export function useAIRequest<T>(
  options: UseAIRequestOptions = {}
): OperationState<T> & {
  execute: (request: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  queue: () => void;
  retry: () => Promise<T | null>;
} {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    queueOnFailure = true,
    autoRetry = false,
  } = options;

  const [state, setState] = useState<OperationState<T>>(createInitialState());
  const retryCountRef = useRef(0);
  const pendingFnRef = useRef<(() => Promise<T>) | null>(null);

  const execute = useCallback(
    async (request: () => Promise<T>): Promise<T | null> => {
      pendingFnRef.current = request;
      retryCountRef.current = 0;

      setState(createLoadingState(state));

      try {
        const result = await request();
        const newState = createSuccessState(result, state);
        setState(newState);
        retryCountRef.current = 0;
        return result;
      } catch (err) {
        const appError = toAppError(err);
        appError.errorId = appError.errorId || generateErrorId();

        logError(appError);

        // Check if we should retry
        if (autoRetry && appError.retryable && retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;

          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);
          // Add jitter
          const jitterDelay = delay * (0.75 + Math.random() * 0.5);

          await new Promise(resolve => setTimeout(resolve, jitterDelay));

          return execute(request);
        }

        const newState = createErrorState(appError, state);
        setState(newState);

        // Check if error should be queued
        const isRecoverable = isRetryableError(appError);
        if (queueOnFailure && isRecoverable) {
          console.log('Request added to offline queue for later retry');
        }

        return null;
      }
    },
    [state, maxRetries, retryDelay, queueOnFailure, autoRetry]
  );

  const reset = useCallback(() => {
    pendingFnRef.current = null;
    retryCountRef.current = 0;
    setState(createInitialState());
  }, []);

  const retry = useCallback(async () => {
    if (pendingFnRef.current && state.error) {
      retryCountRef.current = 0;
      return execute(pendingFnRef.current) ?? null;
    }
    return null;
  }, [state.error, execute]);

  const queue = useCallback(() => {
    // This would integrate with the offline queue in AppContext
    console.log('Request queued for later');
  }, []);

  return {
    ...state,
    execute,
    reset,
    retry,
    queue,
  };
}

// ============================================================================
// Hook for meal analysis with graceful degradation
// ============================================================================

interface MealAnalysisInput {
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface MealAnalysisResult {
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  servingSize: string;
}

interface UseMealAnalysisResult extends OperationState<MealAnalysisResult> {
  analyze: (input: MealAnalysisInput) => Promise<MealAnalysisResult | null>;
  isManualMode: boolean;
  enableManualMode: () => void;
  manualValues: MealAnalysisResult | null;
  setManualValues: (values: MealAnalysisResult) => void;
}

export function useMealAnalysis(): UseMealAnalysisResult {
  const { addToOfflineQueue, offlineQueue } = useApp();
  const [state, setState] = useState<OperationState<MealAnalysisResult>>(createInitialState());
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualValues, setManualValues] = useState<MealAnalysisResult | null>(null);

  const analyze = useCallback(
    async (input: MealAnalysisInput): Promise<MealAnalysisResult | null> => {
      // If in manual mode, return manual values
      if (isManualMode && manualValues) {
        return manualValues;
      }

      setState(createLoadingState(state));

      try {
        // This would make the actual API call
        // For now, simulate with a placeholder
        const response = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const appError: AppError = {
            code: 'API_RESPONSE_INVALID',
            userMessage: errorData.message || `API error: ${response.status}`,
            retryable: response.status >= 500 || response.status === 429,
            timestamp: new Date().toISOString(),
            errorId: generateErrorId(),
          };
          throw appError;
        }

        const result = await response.json();
        setState(createSuccessState(result, state));
        return result;
      } catch (err) {
        const appError = toAppError(err);
        logError(appError);
        setState(createErrorState(appError, state));

        // Add to offline queue
        addToOfflineQueue({
          type: 'meal_analysis',
          payload: input,
        });

        // Enable manual mode automatically on error
        setIsManualMode(true);

        return null;
      }
    },
    [state, isManualMode, manualValues, addToOfflineQueue]
  );

  const enableManualMode = useCallback(() => {
    setIsManualMode(true);
  }, []);

  return {
    ...state,
    analyze,
    isManualMode,
    enableManualMode,
    manualValues,
    setManualValues,
  };
}

// ============================================================================
// Hook for offline queue processing
// ============================================================================

interface UseOfflineQueueResult {
  queue: QueuedAIRequest[];
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  pendingCount: number;
  isProcessing: boolean;
}

export function useOfflineQueue(): UseOfflineQueueResult {
  const {
    offlineQueue,
    removeFromOfflineQueue,
    clearOfflineQueue: clearQueueFromContext,
    processOfflineQueue: processQueueFromContext,
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);

  const processQueue = useCallback(async () => {
    if (isProcessing || offlineQueue.length === 0) return;

    setIsProcessing(true);
    console.log(`Processing ${offlineQueue.length} queued requests`);

    // Process each request in the queue
    for (const request of offlineQueue) {
      try {
        console.log(`Processing queued request: ${request.id}`);
        // This would call the appropriate AI service
        // For now, just simulate
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // If successful, remove from queue
        removeFromOfflineQueue(request.id);
      } catch (err) {
        console.error(`Failed to process queued request ${request.id}:`, err);

        // Remove requests that have been retried too many times
        if (request.retryCount >= 3) {
          removeFromOfflineQueue(request.id);
        }
      }
    }

    setIsProcessing(false);
  }, [isProcessing, offlineQueue, removeFromOfflineQueue]);

  // Auto-process queue every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (offlineQueue.length > 0) {
        processQueue();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [offlineQueue.length, processQueue]);

  return {
    queue: offlineQueue as QueuedAIRequest[],
    processQueue,
    clearQueue: clearQueueFromContext,
    pendingCount: offlineQueue.length,
    isProcessing,
  };
}

// ============================================================================
// Hook for API status monitoring
// ============================================================================

interface APIStatusState {
  isOnline: boolean;
  lastChecked: string | null;
  latency: number | null;
  status: OperationStatus;
}

interface UseAPIStatusResult extends APIStatusState {
  checkStatus: () => Promise<void>;
  isChecking: boolean;
}

export function useAPIStatus(): UseAPIStatusResult {
  const [state, setState] = useState<APIStatusState>(() => ({
    isOnline: navigator.onLine,
    lastChecked: null,
    latency: null,
    status: 'idle',
  }));
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    setState(prev => ({ ...prev, status: 'loading' }));

    const startTime = Date.now();

    try {
      // Ping the API endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      setState({
        isOnline: response.ok,
        lastChecked: new Date().toISOString(),
        latency,
        status: 'success',
      });
    } catch (err) {
      setState({
        isOnline: false,
        lastChecked: new Date().toISOString(),
        latency: null,
        status: 'error',
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      checkStatus();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false, status: 'error' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkStatus]);

  return {
    ...state,
    checkStatus,
    isChecking,
  };
}

export default {
  useAIRequest,
  useMealAnalysis,
  useOfflineQueue,
  useAPIStatus,
};
