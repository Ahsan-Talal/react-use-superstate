import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initKey,
  getState,
  setState,
  subscribe,
  resetState,
  batchUpdate,
  hasKey,
  getKeys,
  destroyStore,
} from '../core/store';

describe('Store', () => {
  beforeEach(() => {
    destroyStore();
  });

  describe('initKey', () => {
    it('should initialize a new key with the given value', () => {
      initKey('count', 0);
      expect(getState('count')).toBe(0);
    });

    it('should not overwrite an existing key', () => {
      initKey('count', 0);
      setState('count', 5);
      initKey('count', 0); // should not reset
      expect(getState('count')).toBe(5);
    });
  });

  describe('getState / setState', () => {
    it('should return undefined for uninitialized keys', () => {
      expect(getState('missing')).toBeUndefined();
    });

    it('should update state with a direct value', () => {
      initKey('count', 0);
      setState('count', 42);
      expect(getState('count')).toBe(42);
    });

    it('should update state with an updater function', () => {
      initKey('count', 10);
      setState<number>('count', (prev) => prev + 5);
      expect(getState('count')).toBe(15);
    });

    it('should skip update if value is referentially identical (Object.is)', () => {
      const listener = vi.fn();
      initKey('count', 0);
      subscribe('count', listener);

      setState('count', 0); // same value
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should notify listener on state change', () => {
      const listener = vi.fn();
      initKey('count', 0);
      subscribe('count', listener);

      setState('count', 1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', () => {
      const listener = vi.fn();
      initKey('count', 0);
      const unsub = subscribe('count', listener);

      unsub();
      setState('count', 99);
      // Listener should NOT be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });

    it('should keep keys even when subscriber count reaches 0', () => {
      initKey('temp', 'value');
      const unsub = subscribe('temp', () => {});

      expect(hasKey('temp')).toBe(true);
      unsub();
      // Global state persists — only destroyStore() or resetState() clears it
      expect(hasKey('temp')).toBe(true);
    });

    it('should be idempotent — calling unsubscribe twice is safe', () => {
      const listener = vi.fn();
      initKey('count', 0);
      const unsub = subscribe('count', listener);

      unsub();
      unsub(); // second call should be a no-op, not decrement subscriberCount

      // Verify the key still works correctly
      setState('count', 42);
      expect(getState('count')).toBe(42);
    });
  });

  describe('resetState', () => {
    it('should reset a specific key to its initial value', () => {
      initKey('count', 0);
      subscribe('count', () => {}); 
      setState('count', 99);
      resetState('count');
      expect(getState('count')).toBe(0);
    });

    it('should reset all keys when called without arguments', () => {
      initKey('a', 1);
      initKey('b', 2);
      subscribe('a', () => {});
      subscribe('b', () => {});
      setState('a', 100);
      setState('b', 200);

      resetState();
      expect(getState('a')).toBe(1);
      expect(getState('b')).toBe(2);
    });
  });

  describe('batchUpdate', () => {
    it('should defer listener notifications until the batch completes', () => {
      const listener = vi.fn();
      initKey('count', 0);
      subscribe('count', listener);

      batchUpdate(() => {
        setState('count', 1);
        setState('count', 2);
        setState('count', 3);
        expect(listener).not.toHaveBeenCalled();
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(getState('count')).toBe(3);
    });
  });

  describe('destroyStore', () => {
    it('should notify all listeners before clearing', () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      initKey('a', 1);
      initKey('b', 2);
      subscribe('a', listenerA);
      subscribe('b', listenerB);

      destroyStore();

      // Both listeners should have been notified
      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(1);
      expect(getKeys()).toEqual([]);
    });

    it('hasKey returns true for existing keys', () => {
      initKey('x', 1);
      expect(hasKey('x')).toBe(true);
    });

    it('destroyStore clears everything', () => {
      initKey('a', 1);
      destroyStore();
      expect(getKeys()).toEqual([]);
    });
  });
});
