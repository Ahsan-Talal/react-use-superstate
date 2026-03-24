// ─── Super State ────────────────────────────────────────────────────────────
// Zero-boilerplate global state for React.
// Works exactly like useState, but shared across every component.

// Core hooks — the main things users need
export { useSuperState } from './useSuperState';
export { createSuperState } from './createSuperState';

// Store utilities (read/write state outside React components)
export {
  getState,
  setState,
  resetState,
  batchUpdate,
  hasKey,
  getKeys,
  destroyStore,
} from './store';

// SSR helpers
export { SuperStateProvider, dehydrate } from './ssr';
export type { SuperStateProviderProps } from './ssr';

// Types
export type { SuperStateTuple, Updater } from './types';
