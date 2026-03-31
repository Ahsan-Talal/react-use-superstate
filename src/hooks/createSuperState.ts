import { useSuperState } from './useSuperState';
import { initKey } from '../core/store';
import type { SuperStateTuple } from '../types';

/**
 * **Declaration (Owner)**: Create a new GLOBAL state.
 * Registers a unique key to the store and returns a tuple perfectly reflecting `useState`.
 * Use `createLocalState` or standard `useState` instead if you do not want it shared globally.
 *
 * @example
 * // Global State shared globally across any component!
 * const [user, setUser] = createSuperState('user', { name: 'Ahsan', age: 25 });
 */
export function createSuperState<T>(key: string, initialValue: T): SuperStateTuple<T> {
  // Initialize global registry (idempotent — initKey skips if key already exists)
  initKey(key, initialValue);
  
  // Delegate to the standard hook to maintain synchronization
  return useSuperState<T>(key);
}
