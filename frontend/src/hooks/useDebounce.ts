import { useEffect, useState } from 'react';

/**
 * Delays a rapidly changing value.
 *
 * Used on the search box so typing does not fire one request per keystroke.
 */
export const useDebounce = <T>(value: T, delayMs = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
