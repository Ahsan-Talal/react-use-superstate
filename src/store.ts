import type { StoreEntry, Updater } from './types';

// ─── Global Registry Singleton Guarantee ─────────────────────────────────────
// Ensures only one registry exists even if the package is bundled twice.
const REGISTRY_SYMBOL = Symbol.for('__SUPER_STATE_REGISTRY__');
const globalObj = (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {})) as any;

if (!globalObj[REGISTRY_SYMBOL]) {
  globalObj[REGISTRY_SYMBOL] = new Map<string, StoreEntry>();
}

const registry: Map<string, StoreEntry> = globalObj[REGISTRY_SYMBOL];

// ─── Batching ───────────────────────────────────────────────────────────────

let batchDepth = 0;
const pendingKeys = new Set<string>();

function flushListeners(key: string): void {
  const entry = registry.get(key);
  if (entry) {
    // We notify all listeners for this key. 
    // Subscribing components will check if their slice has changed.
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
  }
  return registry.get(key) as StoreEntry<T>;
}

export function getState<T>(key: string): T | undefined {
  const entry = registry.get(key);
  return entry ? (entry.value as T) : undefined;
}

export function setState<T>(key: string, updater: Updater<T>): void {
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

  if (batchDepth > 0) {
    pendingKeys.add(key);
  } else {
    flushListeners(key);
  }
}

export function subscribe(key: string, listener: () => void): () => void {
  const entry = registry.get(key);
  if (!entry) return () => {};

  entry.listeners.add(listener);
  entry.subscriberCount++;

  return () => {
    entry.listeners.delete(listener);
    entry.subscriberCount--;
    // Removed auto-cleanup to prevent state loss
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
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      pendingKeys.forEach(flushListeners);
      pendingKeys.clear();
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
  registry.clear();
}

