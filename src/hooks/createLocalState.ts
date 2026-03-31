import { useState } from 'react';
import type { SuperStateTuple } from '../types';

/**
 * **Declaration (Local)**: Create a local state.
 * Identical to React's `useState`. Provided for consistent naming conventions
 * when using `createSuperState` for global state.
 * 
 * You can safely use `useState` directly in place of this.
 *
 * @example
 * const [count, setCount] = createLocalState(0);
 */
export function createLocalState<T>(initialValue: T | (() => T)): SuperStateTuple<T> {
  return useState<T>(initialValue);
}
