import { useRef, useCallback } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<boolean>(false);

  return useCallback(
    (...args: Parameters<T>) => {
      // Prevent multiple rapid calls
      if (pendingRef.current) {
        return;
      }

      pendingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
        pendingRef.current = false;
      }, delay);
    },
    [callback, delay]
  );
}

// Throttle hook - ensures function is called at most once per interval
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const inThrottle = useRef<boolean>(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit]
  );
}
