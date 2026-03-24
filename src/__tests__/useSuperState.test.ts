import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSuperState } from '../useSuperState';
import { createSuperState } from '../createSuperState';
import { destroyStore, getState } from '../store';

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
});
