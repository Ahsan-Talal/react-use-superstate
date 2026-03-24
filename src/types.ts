// ─── Public Types ────────────────────────────────────────────────────────────

/**
 * Updater — either a new value or a function from previous to next.
 * Matches the useState setter signature exactly.
 */
export type Updater<T> = T | ((prev: T) => T);

/**
 * The return tuple from useSuperState — identical to useState.
 */
export type SuperStateTuple<T> = [
  T,
  (value: T | ((prev: T) => T)) => void,
];

/**
 * Internal entry stored per key in the global registry.
 */
export interface StoreEntry<T = unknown> {
  value: T;
  initialValue: T;
  listeners: Set<() => void>;
  subscriberCount: number;
}
