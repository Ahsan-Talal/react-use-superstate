import type { SetStateAction } from 'react';
import type { StoreEntry } from '../types';

// ─── Global Registry Singleton Guarantee ─────────────────────────────────────
// Ensures only one registry, batchDepth, and pendingKeys exist even if the
// package is bundled twice (monorepos, mismatched versions, etc.).

const REGISTRY_SYMBOL = Symbol.for('__SUPER_STATE_REGISTRY__');
const BATCH_SYMBOL = Symbol.for('__SUPER_STATE_BATCH__');

interface BatchState {
  depth: number;
  pendingKeys: Set<string>;
}

const globalObj = globalThis as any;

if (!globalObj[REGISTRY_SYMBOL]) {
  globalObj[REGISTRY_SYMBOL] = new Map<string, StoreEntry>();
}

if (!globalObj[BATCH_SYMBOL]) {
  globalObj[BATCH_SYMBOL] = { depth: 0, pendingKeys: new Set<string>() } as BatchState;
}

const registry: Map<string, StoreEntry> = globalObj[REGISTRY_SYMBOL];
const batch: BatchState = globalObj[BATCH_SYMBOL];

// ─── Internal Helpers ───────────────────────────────────────────────────────

function flushListeners(key: string): void {
  const entry = registry.get(key);
  if (entry) {
    entry.listeners.forEach((listener) => listener());
  }
}

// ─── Core API ───────────────────────────────────────────────────────────────

export function initKey<T>(key: string, initialValue: T): StoreEntry<T> {
  if (!registry.has(key)) {
    registry.set(key, {
      value: initialValue,
      initialValue,
      listeners: new Set(),
      subscriberCount: 0,
    });
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(`[super-state] Duplicate initialization of key "${key}". Use createSuperState once to "own" the state, and useSuperState to consume it elsewhere to avoid conflicting initial values.`);
  }
  return registry.get(key) as StoreEntry<T>;
}

export function getState<T>(key: string): T | undefined {
  const entry = registry.get(key);
  return entry ? (entry.value as T) : undefined;
}

export function setState<T>(key: string, updater: SetStateAction<T>): void {
  const entry = registry.get(key);
  if (!entry) {
    console.warn(`[super-state] Key "${key}" not found.`);
    return;
  }

  const prevValue = entry.value as T;
  const nextValue = typeof updater === 'function'
    ? (updater as (p: T) => T)(prevValue)
    : updater;

  if (Object.is(prevValue, nextValue)) return;

  entry.value = nextValue;

  if (batch.depth > 0) {
    batch.pendingKeys.add(key);
  } else {
    flushListeners(key);
  }
}

export function subscribe(key: string, listener: () => void): () => void {
  const entry = registry.get(key);
  if (!entry) return () => { };

  entry.listeners.add(listener);
  entry.subscriberCount++;

  // Idempotent teardown — safe to call multiple times (matches React's contract)
  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    entry.listeners.delete(listener);
    entry.subscriberCount--;
  };
}

export function resetState(key?: string): void {
  if (key) {
    const entry = registry.get(key);
    if (entry) {
      entry.value = entry.initialValue;
      flushListeners(key);
    }
  } else {
    registry.forEach((entry, k) => {
      entry.value = entry.initialValue;
      flushListeners(k);
    });
  }
}

export function batchUpdate(fn: () => void): void {
  batch.depth++;
  try {
    fn();
  } finally {
    batch.depth--;
    if (batch.depth === 0) {
      batch.pendingKeys.forEach(flushListeners);
      batch.pendingKeys.clear();
    }
  }
}

export function hasKey(key: string): boolean {
  return registry.has(key);
}

export function getKeys(): string[] {
  return Array.from(registry.keys());
}

export function destroyStore(): void {
  // Notify all listeners so components re-render with undefined/fresh state
  registry.forEach((entry) => {
    entry.listeners.forEach((listener) => listener());
  });
  registry.clear();
}
