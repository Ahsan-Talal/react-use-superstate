import { useState } from 'react';
import { useSuperState } from './useSuperState';
import { initKey } from './store';
import type { SuperStateTuple } from './types';

/**
 * **Declaration (Owner)**: Create a new state.
 * If a key is provided, it becomes a GLOBAL state shared across all components.
 * If no key is provided, it works exactly like React's `useState`.
 *
 * @example
 * // Global State
 * const [user, setUser] = createSuperState('user', { name: 'Ahsan', age: 25 });
 * 
 * // Local State (same as useState)
 * const [count, setCount] = createSuperState(0);
 */
export function createSuperState<T>(key: string, initialValue: T): SuperStateTuple<T>;
export function createSuperState<T>(initialValue: T): SuperStateTuple<T>;
export function createSuperState<T>(keyOrVal: string | T, initialVal?: T): SuperStateTuple<T> {
  const isGlobal = typeof keyOrVal === 'string' && arguments.length > 1;

  if (isGlobal) {
    const key = keyOrVal as string;
    const initial = initialVal as T;
    
    // 1. Initialize global registry if it doesn't already exist
    initKey(key, initial);
    
    // 2. Delegate to the standard hook to maintain synchronization
    return useSuperState<T>(key);
  } else {
    // 3. Fallback to standard private state if no key is supplied
    return useState<T>(keyOrVal as T);
  }
}
