import React from 'react';
import { initKey, getState } from './store';

// ─── SSR State Map ──────────────────────────────────────────────────────────

let serverStateMap: Record<string, unknown> | null = null;

/**
 * Sets the server-side state map used during SSR hydration.
 * Called internally by `SuperStateProvider`.
 */
export function setServerState(state: Record<string, unknown>): void {
  serverStateMap = state;

  // Pre-populate the store registry with server state
  for (const [key, value] of Object.entries(state)) {
    initKey(key, value);
  }
}

/**
 * Returns the server-side snapshot for a key.
 * Used as the `getServerSnapshot` argument to `useSyncExternalStore`.
 */
export function getServerSnapshot<T>(key: string, fallback: T): T {
  if (serverStateMap && key in serverStateMap) {
    return serverStateMap[key] as T;
  }
  return fallback;
}

/**
 * Serializes the current store state for injection into server-rendered HTML.
 * Call this on the server after rendering to extract the state.
 *
 * ```tsx
 * const html = renderToString(<App />);
 * const dehydratedState = dehydrate();
 * // Inject into HTML: <script>window.__SUPER_STATE__ = ${JSON.stringify(dehydratedState)}</script>
 * ```
 */
export function dehydrate(): Record<string, unknown> {
  if (serverStateMap) {
    return { ...serverStateMap };
  }
  return {};
}

// ─── Provider Component ─────────────────────────────────────────────────────

export interface SuperStateProviderProps {
  /** Initial state map to hydrate the store with (typically from server). */
  initialState: Record<string, unknown>;
  children: React.ReactNode;
}

/**
 * Provider component for SSR hydration.
 * Wraps your app and pre-populates the global store with server-rendered state.
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
  // Hydrate once on mount — use a ref to avoid re-hydrating on re-renders
  const hydrated = React.useRef(false);
  if (!hydrated.current) {
    setServerState(initialState);
    hydrated.current = true;
  }

  return React.createElement(React.Fragment, null, children);
}
