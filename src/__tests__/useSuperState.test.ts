import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSuperState } from '../hooks/useSuperState';
import { createSuperState } from '../hooks/createSuperState';
import { destroyStore, getState } from '../core/store';

describe('useSuperState', () => {
  beforeEach(() => {
    destroyStore();
  });

  it('owner should initialize state successfully', () => {
    const { result } = renderHook(() => createSuperState('count', 0));
    expect(result.current[0]).toBe(0);
  });

  it('consumer should throw if state is not initialized by owner', () => {
    // Suppress console.error for expected throw
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useSuperState('missingData'));
    }).toThrow(/Key "missingData" not initialized/);


    console.error = originalError;
  });

  it('consumer can access state after owner initializes it', () => {
    // 1. Owner initializes
    renderHook(() => createSuperState('shared', 'hello'));

    // 2. Consumer accesses
    const { result } = renderHook(() => useSuperState('shared'));
    expect(result.current[0]).toBe('hello');
  });

  it('updates should sync across multiple hook instances', () => {
    const { result: owner } = renderHook(() => createSuperState('shared', 'hello'));
    const { result: consumer } = renderHook(() => useSuperState('shared'));

    act(() => {
      owner.current[1]('world');
    });

    expect(owner.current[0]).toBe('world');
    expect(consumer.current[0]).toBe('world');
  });

  it('should support updater function like setState(prev => next)', () => {
    const { result: owner } = renderHook(() => createSuperState('count', 10));

    act(() => {
      owner.current[1]((prev) => prev + 5);
    });

    expect(owner.current[0]).toBe(15);
  });

  it('should handle complex object mutations immutably', () => {
    type User = { name: string; age: number };
    const initial: User = { name: 'Alice', age: 30 };

    const { result: owner } = renderHook(() => createSuperState<User>('user', initial));

    act(() => {
      owner.current[1]((prev) => ({ ...prev, age: 31 }));
    });

    expect(owner.current[0]).toEqual({ name: 'Alice', age: 31 });
  });

  it('should allow direct global store updates via setState', () => {
    const { result: owner } = renderHook(() => createSuperState('direct', 42));

    act(() => {
      owner.current[1](100);
    });

    expect(getState('direct')).toBe(100);
  });

  // ─── Brutal Edge Case Tests ───────────────────────────────────────────────

  it('should safely construct deep properties via dot-notation if they are completely undefined', () => {
    // Component 1 creates state implicitly as undefined initially or an empty object
    const { result: owner } = renderHook(() => createSuperState('deepUser', undefined as any));
    
    // Setup nested path string that doesn't exist yet
    const { result: nested } = renderHook(() => useSuperState('deepUser.profile.social.twitter'));

    act(() => {
      // Act: Write directly to an uninitialized deep path!
      nested.current[1]('@ahsan');
    });

    // Asset: SuperState should have generated `{ profile: { social: { twitter: '@ahsan' } } }`
    expect(nested.current[0]).toBe('@ahsan');
    expect(owner.current[0]).toEqual({ profile: { social: { twitter: '@ahsan' } } });
  });

  it('should safely construct deep array buckets via bracket-notation if undefined', () => {
    const { result: root } = renderHook(() => createSuperState('matrix', null as any));
    const { result: cell } = renderHook(() => useSuperState('matrix.rows[0].cols[2]'));

    act(() => {
      cell.current[1]('X');
    });

    // Assert that bracket notation `[0]` successfully yielded an array `[]`, not an object `{ '0': ... }`
    expect(root.current[0].rows).toBeInstanceOf(Array);
    expect(root.current[0].rows[0].cols).toBeInstanceOf(Array);
    expect(root.current[0].rows[0].cols[2]).toBe('X');
    expect(cell.current[0]).toBe('X');
  });

  it('mutating an array explicitly does not destroy other items in the sequence', () => {
    const { result: root } = renderHook(() => createSuperState('list', [1, 2, 3]));
    const { result: middleItem } = renderHook(() => useSuperState('list[1]'));

    act(() => {
      middleItem.current[1](99);
    });

    expect(root.current[0]).toEqual([1, 99, 3]); // Only middle mutated
    expect(middleItem.current[0]).toBe(99);
  });

  it('module cache correctly evicts boundaries in extreme path generation', () => {
    // Since our cache limit is 1000, we write 1005 distinct keys.
    renderHook(() => createSuperState('cacheTest', 0));
    for (let i = 0; i <= 1005; i++) {
        renderHook(() => useSuperState(`cacheTest.prop${i}`));
    }
    // No crash, and the 1005th works perfectly.
    const { result: val } = renderHook(() => useSuperState('cacheTest.prop1005'));
    act(() => {
      val.current[1]('survived');
    });
    expect(val.current[0]).toBe('survived');
  });
});
