/**
 * useDebounce — Arama inputları için debounce hook.
 *
 * Kullanım:
 *   const debouncedQuery = useDebounce(searchQuery, 500);
 *
 * 500ms içinde yeni değer gelmezse debouncedQuery güncellenir.
 * Bu sayede her harf girişinde API çağrısı yapılmaz.
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
