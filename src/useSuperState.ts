import { useSyncExternalStore, useCallback, useMemo } from 'react';
import { getState, setState, subscribe, hasKey } from './store';
import type { SuperStateTuple } from './types';

export function useSuperState<T = unknown>(key: string): SuperStateTuple<T> {
  const [rootKey, ...path] = useMemo(() => key.split('.'), [key]);

  if (!hasKey(rootKey)) {
    throw new Error(`[super-state] Key "${rootKey}" not initialized. Use createSuperState first.`);
  }

  const subscribeToKey = useCallback((l: () => void) => subscribe(rootKey, l), [rootKey]);

  const getSnapshot = useCallback((): T => {
    const rootState = getState<any>(rootKey);
    return path.reduce((acc, part) => (acc != null ? acc[part] : undefined), rootState) as T;
  }, [rootKey, key]); // key is stable, path was derived from it.

  const value = useSyncExternalStore(subscribeToKey, getSnapshot, getSnapshot);

  const setValue = useCallback(
    (updater: any): void => {
      const isPathUpdate = path.length > 0;
      
      if (!isPathUpdate) {
        setState(rootKey, updater);
      } else {
        setState(rootKey, (prevRoot: any) => {
          const currentVal = path.reduce((acc, part) => (acc != null ? acc[part] : undefined), prevRoot);
          const nextVal = typeof updater === 'function' ? updater(currentVal) : updater;
          
          if (Object.is(currentVal, nextVal)) return prevRoot;

          return setNestedValue(prevRoot, path, nextVal);
        });
      }
    },
    [rootKey, path] // path is memoized
  );

  return [value, setValue];
}

function setNestedValue(obj: any, path: string[], nextValue: any): any {
  if (path.length === 0) return nextValue;
  const [head, ...tail] = path;
  
  const isArray = Array.isArray(obj);
  const clone = isArray ? [...obj] : { ...obj };
  
  clone[head] = tail.length === 0 
    ? nextValue 
    : setNestedValue(obj[head] != null ? obj[head] : {}, tail, nextValue);
    
  return clone;
}

