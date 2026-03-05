import { useState, useRef, useCallback, useEffect } from "react";

export interface DebouncedStateOptions {
  /** Delay in milliseconds before triggering onDebouncedUpdate */
  delay?: number;
  /** Callback fired immediately on state change */
  onImmediateUpdate?: (state: Record<string, unknown>) => void;
  /** Callback fired after debounce delay */
  onDebouncedUpdate?: (state: Record<string, unknown>) => void;
}

/**
 * Hook for managing state with debounced updates
 * Useful for sliders and other controls that update frequently
 * 
 * @example
 * ```tsx
 * const [localState, updateLocalState] = useDebouncedState(
 *   selectedLayer, 
 *   50,
 *   (updates) => onUpdateLayer(updates)
 * );
 * 
 * <Slider 
 *   value={[localState.blur]} 
 *   onValueChange={(v) => updateLocalState({ blur: v[0] })}
 * />
 * ```
 */
export function useDebouncedState<T extends Record<string, unknown>>(
  initialState: T,
  delay: number = 50,
  onDebouncedUpdate?: (updates: Partial<T>) => void
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<Partial<T> | null>(null);

  // Sync with external initialState changes
  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const updateState = useCallback((updates: Partial<T>) => {
    // Update local state immediately for responsive UI
    setState(prev => ({ ...prev, ...updates }));
    
    // Store pending updates
    pendingUpdatesRef.current = { 
      ...pendingUpdatesRef.current, 
      ...updates 
    };
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      if (pendingUpdatesRef.current && onDebouncedUpdate) {
        onDebouncedUpdate(pendingUpdatesRef.current);
        pendingUpdatesRef.current = null;
      }
    }, delay);
  }, [delay, onDebouncedUpdate]);

  return [state, updateState];
}

/**
 * Hook for debouncing a callback function
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback((query) => {
 *   performSearch(query);
 * }, 300);
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback reference up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

/**
 * Hook for debouncing a value
 * Returns the debounced value after the specified delay
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * 
 * // Use debouncedQuery for API calls
 * useEffect(() => {
 *   searchAPI(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
}
