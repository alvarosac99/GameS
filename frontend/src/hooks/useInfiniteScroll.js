import { useEffect, useRef } from "react";

/**
 * Llama a `onLoadMore` cuando el elemento devuelto (`sentinelRef`) entra en
 * el viewport, mientras `hasMore` sea true y no haya una carga en curso.
 */
export function useInfiniteScroll(onLoadMore, { hasMore, loading, rootMargin = "600px" } = {}) {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          callbackRef.current();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, rootMargin]);

  return sentinelRef;
}
