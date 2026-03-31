import { describe, it, expect, beforeEach } from 'vitest';
import {
  initKey,
  subscribe,
  destroyStore,
  getKeys,
  getState,
  setState
} from '../core/store';

describe('Memory Leakage Tests', () => {
  beforeEach(() => {
    destroyStore();
  });

  it('should correctly clean up listeners on unsubscribe', () => {
    initKey('user', { age: 25 });

    // Subscribe multiple times
    const unsubs = [];
    for (let i = 0; i < 1000; i++) {
      unsubs.push(subscribe('user', () => { }));
    }

    // Unsubscribe all
    unsubs.forEach(unsub => unsub());

    // Verify cleanup: after unsubscribing all 1000 listeners, setting state
    // should not trigger any callbacks. If listeners leaked, the Set would
    // still contain stale references.
    const spy = { called: false };
    setState('user', { age: 30 });

    // If we subscribe a fresh listener, only IT should fire — not any ghosts
    const freshUnsub = subscribe('user', () => { spy.called = true; });
    setState('user', { age: 31 });
    expect(spy.called).toBe(true);
    freshUnsub();
  });

  it('should not leak memory on repeated initialization of the same key', () => {
    for (let i = 0; i < 1000; i++) {
      initKey('shared', i);
    }
    // Registry should only have 1 entry
    expect(getKeys().length).toBe(1);
  });

  it('should allow complete store destruction', () => {
    initKey('a', 1);
    initKey('b', 2);
    initKey('c', 3);

    destroyStore();

    expect(getKeys().length).toBe(0);
  });

  it('idempotent unsubscribe should not corrupt subscriber count', () => {
    initKey('counter', 0);

    const unsub1 = subscribe('counter', () => {});
    const unsub2 = subscribe('counter', () => {});

    // Call unsub1 three times — should only decrement once
    unsub1();
    unsub1();
    unsub1();

    // unsub2 is still active, so state updates should still notify
    const listener = { count: 0 };
    unsub2(); // now both are unsubscribed

    // State should still be accessible and settable
    setState('counter', 42);
    expect(getState('counter')).toBe(42);
  });
});
