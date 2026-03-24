import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSuperState } from './useSuperState';
import { createSuperState } from './createSuperState';

describe('Super State v2 API', () => {
  it('should support createSuperState with key (Global)', () => {
    // 1. Initialize Owner
    const { result: owner } = renderHook(() => 
      createSuperState('user', { name: 'Ahsan', age: 25 })
    );

    // 2. Consume nested property
    const { result: consumer } = renderHook(() => 
      useSuperState('user.age')
    );

    expect(consumer.current[0]).toBe(25);

    act(() => {
      consumer.current[1](26);
    });

    expect(consumer.current[0]).toBe(26);
    expect(owner.current[0]).toEqual({ name: 'Ahsan', age: 26 });
  });

  it('should support createSuperState without key (Local)', () => {
    const { result } = renderHook(() => createSuperState(0));
    
    expect(result.current[0]).toBe(0);
    
    act(() => {
      result.current[1](1);
    });
    
    expect(result.current[0]).toBe(1);
  });

  it('should support dot notation for deep updates without rerendering siblings', () => {
    renderHook(() => createSuperState('profile', { name: 'Ahsan', age: 25 }));

    let renderCountAge = 0;
    const { result: ageHook } = renderHook(() => {
      renderCountAge++;
      return useSuperState<number>('profile.age');
    });

    let renderCountName = 0;
    const { result: nameHook } = renderHook(() => {
      renderCountName++;
      return useSuperState<string>('profile.name');
    });

    expect(renderCountAge).toBe(1);
    expect(renderCountName).toBe(1);

    // Update age only
    act(() => {
      ageHook.current[1](26);
    });

    expect(renderCountAge).toBe(2);
    expect(renderCountName).toBe(1); // Sibling did not rerender
  });
});
