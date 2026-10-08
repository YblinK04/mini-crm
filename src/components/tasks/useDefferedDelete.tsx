'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY = 3000;

export function useDeferredDelete(
  onCommit: (id: string) => void,
  delay = DEFAULT_DELAY,
) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  const schedule = useCallback(
    (id: string) => {
      if (timers.current.has(id)) return;

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      const timer = setTimeout(() => {
        timers.current.delete(id);
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        commitRef.current(id);
      }, delay);

      timers.current.set(id, timer);
    },
    [delay],
  );

  const cancel = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setPendingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const [id, t] of map.entries()) {
        clearTimeout(t);
        try {
          commitRef.current(id);
        } catch (e) {
          console.error('[useDeferredDelete] commit on unmount failed:', id, e);
        }
      }
      map.clear();
    };
  }, []);

  return { pendingIds, schedule, cancel };
}