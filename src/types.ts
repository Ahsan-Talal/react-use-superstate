import type { Dispatch, SetStateAction } from 'react';

/**
 * The return tuple from useSuperState — identical to useState.
 */
export type SuperStateTuple<T> = [T, Dispatch<SetStateAction<T>>];

/**
 * Internal entry stored per key in the global registry.
 */
export interface StoreEntry<T = unknown> {
  value: T;
  initialValue: T;
  listeners: Set<() => void>;
  subscriberCount: number;
}
