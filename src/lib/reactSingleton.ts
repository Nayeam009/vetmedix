/**
 * React Singleton Guard — Runtime Dispatcher Bridge
 *
 * This is the RUNTIME FALLBACK for the duplicate-React-instance crash.
 * The PRIMARY fix is vite.config.ts → cacheDir: "node_modules/.vite-vetmedix",
 * which forces a fresh esbuild pre-bundle that co-bundles react + react-dom
 * into one chunk with a single shared ReactCurrentDispatcher.
 *
 * If two React chunks somehow still end up loaded (e.g. edge cases with
 * third-party libs bundling their own react), this guard ensures they share
 * one dispatcher via Object.defineProperty proxying.
 *
 * MUST be the very first import in main.tsx so it runs before any hooks.
 */

import React from "react";

type ReactInternals = {
  ReactCurrentDispatcher: { current: unknown };
  ReactCurrentBatchConfig: { transition: unknown };
  ReactCurrentOwner: { current: unknown };
};

declare global {
  interface Window {
    __REACT_SINGLETON__?: ReactInternals;
  }
}

const internals = (React as any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as ReactInternals;

if (typeof window !== "undefined") {
  if (!window.__REACT_SINGLETON__) {
    // First (and ideally only) React chunk — register as canonical.
    window.__REACT_SINGLETON__ = internals;
  } else {
    // A second React chunk loaded. Proxy its dispatcher .current to the
    // canonical one so reads/writes always go through the same object.
    const canonical = window.__REACT_SINGLETON__;
    const localDisp  = internals.ReactCurrentDispatcher;
    const canonDisp  = canonical.ReactCurrentDispatcher;

    if (localDisp && canonDisp && localDisp !== canonDisp) {
      Object.defineProperty(localDisp, "current", {
        get()  { return canonDisp.current; },
        set(v) { canonDisp.current = v;    },
        configurable: true,
        enumerable:   true,
      });
    }

    const localBatch = internals.ReactCurrentBatchConfig;
    const canonBatch = canonical.ReactCurrentBatchConfig;
    if (localBatch && canonBatch && localBatch !== canonBatch) {
      Object.defineProperty(localBatch, "transition", {
        get()  { return canonBatch.transition; },
        set(v) { canonBatch.transition = v;    },
        configurable: true,
        enumerable:   true,
      });
    }

    const localOwner = internals.ReactCurrentOwner;
    const canonOwner = canonical.ReactCurrentOwner;
    if (localOwner && canonOwner && localOwner !== canonOwner) {
      Object.defineProperty(localOwner, "current", {
        get()  { return canonOwner.current; },
        set(v) { canonOwner.current = v;    },
        configurable: true,
        enumerable:   true,
      });
    }
  }
}
