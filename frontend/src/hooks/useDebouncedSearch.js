import { useEffect, useRef, useState } from "react";

/**
 * Ejecuta `fetcher(query)` tras `delay` ms sin cambios en `query`, ignorando
 * resultados que lleguen fuera de orden. No dispara nada si `query` no llega
 * a `minLength` o si `enabled` es false.
 */
export function useDebouncedSearch(query, fetcher, { delay = 300, minLength = 2, enabled = true } = {}) {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled || query.trim().length < minLength) {
      setResultados([]);
      setCargando(false);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    const id = setTimeout(() => {
      Promise.resolve(fetcherRef.current(query))
        .then((data) => {
          if (!cancelado) setResultados(data || []);
        })
        .catch(() => {
          if (!cancelado) setResultados([]);
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }, delay);

    return () => {
      cancelado = true;
      clearTimeout(id);
    };
  }, [query, enabled, delay, minLength]);

  return { resultados, cargando, setResultados };
}
