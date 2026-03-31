import { useSyncExternalStore, useCallback } from 'react';
import { getState, setState, subscribe, hasKey } from '../core/store';
import type { SuperStateTuple } from '../types';
import { useServerStateContext } from '../ssr';
import type { SetStateAction } from 'react';

// ─── Path Parsing Cache ─────────────────────────────────────────────────────
// Module-level caching prevents recalculating object paths every render
// Satisfies js-cache-function-results Vercel best practice
const pathCache = new Map<string, { rootKey: string; subPath: string[] }>();

function getParsedPath(key: string) {
  let cached = pathCache.get(key);
  if (cached) return cached;

  // Simple LRU-style boundary to prevent memory leaks from infinite dynamic keys
  if (pathCache.size >= 1000) pathCache.clear();

  const fullPath = key.split(/[.\[\]]/).filter(Boolean);
  cached = {
    rootKey: fullPath[0],
    subPath: fullPath.slice(1),
  };
  
  pathCache.set(key, cached);
  return cached;
}

export function useSuperState<T = unknown>(key: string): SuperStateTuple<T> {
  // ── Dev-mode key validation ─────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      console.warn('[super-state] Invalid key: key must be a non-empty string.');
    }
    if (/^[.]|[.]$|[.]{2,}/.test(key)) {
      console.warn(`[super-state] Suspicious key "${key}": avoid leading/trailing dots or consecutive dots.`);
    }
  }

  const serverStateMap = useServerStateContext();

  // Root validation based strictly on parsed roots
  if (typeof window !== 'undefined') {
    const { rootKey } = getParsedPath(key);
    if (!serverStateMap && !hasKey(rootKey)) {
      throw new Error(`[super-state] Key "${rootKey}" not initialized. Use createSuperState first.`);
    }
  }

  // Stable subscribe reference. Only primitive `key` is in deps
  const subscribeToKey = useCallback(
    (l: () => void) => {
      const { rootKey } = getParsedPath(key);
      return subscribe(rootKey, l);
    },
    [key]
  );

  // Memoized snapshot functions using only `key` dep.
  const getSnapshot = useCallback((): T => {
    const { rootKey, subPath } = getParsedPath(key);
    const rootState = getState<any>(rootKey);
    if (subPath.length === 0) return rootState as T;
    return subPath.reduce((acc, part) => (acc != null ? acc[part] : undefined), rootState) as T;
  }, [key]);

  const getServerSnapshot = useCallback((): T => {
    const { rootKey, subPath } = getParsedPath(key);
    const rootState = serverStateMap && rootKey in serverStateMap
      ? serverStateMap[rootKey] 
      : getState<any>(rootKey);
    if (subPath.length === 0) return rootState as T;
    return subPath.reduce((acc, part) => (acc != null ? acc[part] : undefined), rootState) as T;
  }, [key, serverStateMap]);

  const value = useSyncExternalStore(subscribeToKey, getSnapshot, getServerSnapshot);

  // Stable setter reference using only `key` dep
  const setValue = useCallback((updater: SetStateAction<T>): void => {
    const { rootKey, subPath } = getParsedPath(key);
    const isPathUpdate = subPath.length > 0;
    
    if (!isPathUpdate) {
      setState(rootKey, updater);
    } else {
      setState(rootKey, (prevRoot: any) => {
        const currentVal = subPath.reduce((acc, part) => (acc != null ? acc[part] : undefined), prevRoot);
        const nextVal = typeof updater === 'function' ? (updater as (prev: T) => T)(currentVal) : updater;
        
        if (Object.is(currentVal, nextVal)) return prevRoot;

        return setNestedValue(prevRoot, subPath, nextVal);
      });
    }
  }, [key]);

  return [value, setValue];
}

function setNestedValue(obj: any, path: string[], nextValue: any): any {
  if (path.length === 0) return nextValue;
  const [head, ...tail] = path;
  
  const isArray = Array.isArray(obj);
  // Do not spread null/undefined objects
  const clone = isArray ? [...obj] : { ...(obj || {}) };
  
  // Safe access to prevent Cannot read properties of null/undefined
  const target = obj == null ? undefined : obj[head];
  
  // For auto-creating intermediate containers, detect if the next segment
  // is a numeric index (to create [] instead of {})
  const nextSegment = tail[0];
  const emptyContainer = nextSegment != null && /^\d+$/.test(nextSegment) ? [] : {};
  clone[head] = tail.length === 0 
    ? nextValue 
    : setNestedValue(target != null ? target : emptyContainer, tail, nextValue);
    
  return clone;
}
