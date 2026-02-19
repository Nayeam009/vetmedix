/**
 * React Singleton Guard
 * 
 * Root Cause: The Lovable Cloud preview infrastructure pre-warms Vite's esbuild
 * dependency cache in separate passes for "react" and "react-dom". This produces
 * two output chunks with different content hashes (e.g. chunk-PMKBOVCG.js vs
 * chunk-LPF6KSF2.js). Each chunk contains its own copy of ReactCurrentDispatcher.
 * When ReactDOM's renderWithHooks() initializes the dispatcher on its copy, and
 * a component calls useState() via the OTHER copy, the dispatcher is null → crash.
 *
 * Solution: Before any React consumer code runs, we check if a global React
 * singleton has already been registered. If it has, we replace the current module's
 * internal __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED with the registered
 * one, ensuring all code shares one ReactCurrentDispatcher object regardless of
 * how many separate chunks loaded React.
 *
 * This is placed in main.tsx as the FIRST import so it runs before any component
 * code can call useState/useEffect/etc.
 */

import React from "react";

type ReactInternals = {
  ReactCurrentDispatcher: { current: unknown };
  ReactCurrentBatchConfig: unknown;
  ReactCurrentOwner: unknown;
};

declare global {
  interface Window {
    __REACT_SINGLETON__?: {
      internals: ReactInternals;
      React: typeof React;
    };
  }
}

const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as ReactInternals;

if (typeof window !== "undefined") {
  if (!window.__REACT_SINGLETON__) {
    // First chunk to load — register as the canonical singleton
    window.__REACT_SINGLETON__ = { internals, React };
  } else {
    // A second React chunk loaded — hijack its internals to point at the
    // canonical ReactCurrentDispatcher from the first chunk.
    const canonical = window.__REACT_SINGLETON__.internals;
    internals.ReactCurrentDispatcher = canonical.ReactCurrentDispatcher;
    internals.ReactCurrentBatchConfig = canonical.ReactCurrentBatchConfig;
    internals.ReactCurrentOwner = canonical.ReactCurrentOwner;
  }
}
