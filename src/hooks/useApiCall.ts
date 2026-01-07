/**
 * Enhanced API Call Hook with State Machine Pattern
 * Handles API calls with stable state: {status, data, error}
 */

import { useState, useCallback, useRef } from 'react';
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
} from '../utils/errors';

// ============================================================================
// Types
// ============================================================================

interface UseApiCallOptions<T> {
  /** Initial data */
  initialData?: T | null;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Base delay for retries (ms) */
  baseDelay?: number;
  /** Maximum delay for retries (ms) */
  maxDelay?: number;
  /** Enable automatic retry on error */
  autoRetry?: boolean;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: AppError) => void;
  /** Callback when status changes */
  onStatusChange?: (status: OperationStatus) => void;
}

interface UseApiCallResult<T> extends OperationState<T> {
  execute: (fn: () => Promise<T>, options?: { silent?: boolean }) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useApiCall<T>(
  options: UseApiCallOptions<T> = {}
): UseApiCallResult<T> {
  const {
    initialData = null,
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    autoRetry = false,
    onSuccess,
    onError,
    onStatusChange,
  } = options;

  const [state, setState] = useState<OperationState<T>>(() => ({
    status: initialData ? 'success' : 'idle',
    data: initialData,
    error: null,
    lastUpdated: initialData ? new Date().toISOString() : undefined,
  }));

  const retryCountRef = useRef(0);
  const pendingFnRef = useRef<(() => Promise<T>) | null>(null);

  const updateStatus = useCallback((status: OperationStatus) => {
    setState(prev => ({ ...prev, status }));
    onStatusChange?.(status);
  }, [onStatusChange]);

  const execute = useCallback(async (
    fn: () => Promise<T>,
    options: { silent?: boolean } = {}
  ): Promise<T | null> => {
    pendingFnRef.current = fn;
    retryCountRef.current = 0;

    setState(createLoadingState(state));

    try {
      const data = await fn();
      const newState = createSuccessState(data, state);
      setState(newState);
      onSuccess?.(data);
      return data;
    } catch (error) {
      const appError = toAppError(error, { functionName: fn.name });
      appError.errorId = appError.errorId || generateErrorId();
      
      if (!options.silent) {
        logError(appError);
      }

      // Check if we should retry
      if (autoRetry && appError.retryable && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        
        const delay = baseDelay * Math.pow(2, retryCountRef.current - 1);
        const actualDelay = Math.min(delay, maxDelay);
        
        // Add jitter
        const jitterDelay = actualDelay * (0.75 + Math.random() * 0.5);
        
        await new Promise(resolve => setTimeout(resolve, jitterDelay));
        
        return execute(fn, options);
      }

      const newState = createErrorState(appError, state);
      setState(newState);
      onError?.(appError);
      return null;
    }
  }, [state, autoRetry, maxRetries, baseDelay, maxDelay, onSuccess, onError]);

  const reset = useCallback(() => {
    pendingFnRef.current = null;
    retryCountRef.current = 0;
    setState(createInitialState<T>());
  }, []);

  const retry = useCallback(async () => {
    if (pendingFnRef.current && state.error) {
      retryCountRef.current = 0;
      return execute(pendingFnRef.current) ?? null;
    }
    return null;
  }, [state.error, execute]);

  return {
    ...state,
    execute,
    reset,
    retry,
  };
}

// ============================================================================
// Form State Hook (Enhanced)
// ============================================================================

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

interface UseFormResult<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (name: keyof T, value: unknown) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: () => void;
  resetForm: () => void;
  setFieldValue: (name: keyof T, value: unknown) => void;
  setFieldError: (name: keyof T, error: string) => void;
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormResult<T> {
  const { initialValues, validate, onSubmit } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (name: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear error when value changes
      if (errors[name as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback((name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors as Partial<Record<keyof T, string>>);
    }
  }, [validate, values]);

  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<keyof T, boolean>
    );
    setTouched(allTouched);

    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors as Partial<Record<keyof T, string>>);

      // If there are errors, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, onSubmit, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name: keyof T, value: unknown) => {
    handleChange(name, value);
  }, [handleChange]);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
  };
}

// ============================================================================
// Async Operation Hook with Retry (Enhanced)
// ============================================================================

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  maxRetries?: number;
}

interface UseAsyncResult<T> extends OperationState<T> {
  execute: (asyncFunction: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T>(
  options: UseAsyncOptions<T> = {}
): UseAsyncResult<T> {
  const { onSuccess, onError, maxRetries = 3 } = options;

  const [state, setState] = useState<OperationState<T>>(createInitialState());
  const retryCountRef = useRef(0);

  const execute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
    setState(createLoadingState(state));

    try {
      const result = await asyncFunction();
      setState(createSuccessState(result, state));
      retryCountRef.current = 0;
      onSuccess?.(result);
      return result;
    } catch (error) {
      const appError = toAppError(error);
      appError.errorId = appError.errorId || generateErrorId();
      logError(appError);

      // Retry logic with limit
      if (appError.retryable && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        console.log(`Retry attempt ${retryCountRef.current} of ${maxRetries}`);

        const delay = 1000 * Math.pow(2, retryCountRef.current - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        return execute(asyncFunction);
      }

      setState(createErrorState(appError, state));
      onError?.(appError);
      return null;
    }
  }, [state, maxRetries, onSuccess, onError]);

  const reset = useCallback(() => {
    setState(createInitialState());
    retryCountRef.current = 0;
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useApiCall;
