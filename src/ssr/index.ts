import React, { createContext, useContext, useRef } from 'react';
import { initKey } from '../core/store';

// ─── SSR State Context ──────────────────────────────────────────────────────

const SuperStateContext = createContext<Record<string, unknown> | null>(null);

// For React 19 forward-compatibility without breaking React 18
const useSafe = React.use || useContext;

/**
 * Hook to retrieve server state map during SSR.
 * Used internally by `useSuperState` to prevent global registry data leaks.
 */
export function useServerStateContext(): Record<string, unknown> | null {
  return useSafe(SuperStateContext);
}

// ─── Provider Component ─────────────────────────────────────────────────────

export interface SuperStateProviderProps {
  /** Initial state map to hydrate the store with (typically from server). */
  initialState: Record<string, unknown>;
  children: React.ReactNode;
}

/**
 * Provider component for SSR hydration and safety.
 * Wraps your app and pre-populates the global store with server-rendered state.
 * Prevents SSR data leaks by providing isolated state per request via Context.
 *
 * ```tsx
 * <SuperStateProvider initialState={window.__SUPER_STATE__}>
 *   <App />
 * </SuperStateProvider>
 * ```
 */
export function SuperStateProvider({
  initialState,
  children,
}: SuperStateProviderProps): React.ReactElement {
  // Hydrate the global registry once on the client
  const hydrated = useRef(false);
  if (!hydrated.current && typeof window !== 'undefined') {
    for (const [key, value] of Object.entries(initialState)) {
      initKey(key, value);
    }
    hydrated.current = true;
  }

  return React.createElement(SuperStateContext.Provider, { value: initialState }, children);
}
