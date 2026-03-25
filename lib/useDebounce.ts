import { useEffect, useRef } from 'react';

/**
 * Retrasa la ejecución de un callback hasta que han pasado
 * `delay` milisegundos desde la última llamada (debounce).
 * 
 * @param callback  Función a ejecutar tras el silencio
 * @param delay     Tiempo de espera en ms
 */
export const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFn = (...args: any[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn;
};
