// ─── Super State ────────────────────────────────────────────────────────────
// Zero-boilerplate global state for React.
// Works exactly like useState, but shared across every component.

// Core hooks — the main things users need
export { useSuperState } from './hooks/useSuperState';
export { createSuperState } from './hooks/createSuperState';
export { createLocalState } from './hooks/createLocalState';

// Store utilities (read/write state outside React components)
export {
  getState,
  setState,
  resetState,
  batchUpdate,
  hasKey,
  getKeys,
  destroyStore,
  initKey as initState,
} from './core/store';

// SSR helpers
export { SuperStateProvider, useServerStateContext } from './ssr';
export type { SuperStateProviderProps } from './ssr';

// Types
export type { SuperStateTuple } from './types';
