/**
 * React Dispatcher Bridge — THE definitive fix for the duplicate-React crash.
 *
 * ROOT CAUSE:
 *   Vite pre-bundles `react` and `react-dom` into SEPARATE chunk files.
 *   Each chunk has its OWN `ReactCurrentDispatcher` object (a plain JS object).
 *   - react-dom's renderWithHooks() SETS:  reactDOMInternals.ReactCurrentDispatcher.current = dispatcher
 *   - react's useState() READS:            reactInternals.ReactCurrentDispatcher.current
 *   These are DIFFERENT objects → react reads null → crash.
 *
 * THE FIX:
 *   Import react-dom here and proxy react-dom's ReactCurrentDispatcher.current
 *   so that any SET also writes to react's ReactCurrentDispatcher.current.
 *   This way renderWithHooks (react-dom) and useState (react) share one dispatcher.
 *
 * MUST be the very first import in main.tsx.
 */

import React from "react";
// We must import react-dom to access its internal dispatcher object.
// This import is safe — it doesn't render anything, just loads the module.
import * as ReactDOMModule from "react-dom";

const getInternals = (mod: any) =>
  mod?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ?? 
  mod?.default?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const reactInternals = getInternals(React);
const reactDOMInternals = getInternals(ReactDOMModule);

if (typeof window !== "undefined" && reactInternals && reactDOMInternals) {
  const WIN = window as any;

  // ── Store the canonical (first-loaded) React internals ──────────────────
  if (!WIN.__REACT_CANONICAL__) {
    WIN.__REACT_CANONICAL__ = reactInternals;
  }

  const canonical: typeof reactInternals = WIN.__REACT_CANONICAL__;
  const canonDispatcher = canonical.ReactCurrentDispatcher;

  // ── Cross-wire react-dom's dispatcher → react's dispatcher ──────────────
  // When renderWithHooks (inside react-dom's chunk) writes:
  //   ReactCurrentDispatcher.current = workInProgressHook
  // we intercept that write and ALSO set react's dispatcher.
  // So when useState (inside react's chunk) reads ReactCurrentDispatcher.current
  // it gets the correct dispatcher instead of null.
  const reactDOMDispatcher = reactDOMInternals.ReactCurrentDispatcher;
  if (canonDispatcher && reactDOMDispatcher && canonDispatcher !== reactDOMDispatcher) {
    Object.defineProperty(reactDOMDispatcher, "current", {
      get() { return canonDispatcher.current; },
      set(v) { canonDispatcher.current = v; },
      configurable: true,
      enumerable: true,
    });
  }

  // ── Also cross-wire react's own dispatcher if it differs from canonical ─
  // (handles the case where reactSingleton itself is a secondary React chunk)
  const reactDispatcher = reactInternals.ReactCurrentDispatcher;
  if (canonDispatcher && reactDispatcher && canonDispatcher !== reactDispatcher) {
    Object.defineProperty(reactDispatcher, "current", {
      get() { return canonDispatcher.current; },
      set(v) { canonDispatcher.current = v; },
      configurable: true,
      enumerable: true,
    });
  }

  // ── Cross-wire ReactCurrentBatchConfig and ReactCurrentOwner ────────────
  for (const key of ["ReactCurrentBatchConfig", "ReactCurrentOwner"] as const) {
    const canonObj = canonical[key];
    const domObj = reactDOMInternals[key];
    if (canonObj && domObj && canonObj !== domObj) {
      for (const prop of Object.keys(canonObj)) {
        try {
          Object.defineProperty(domObj, prop, {
            get() { return canonObj[prop]; },
            set(v) { canonObj[prop] = v; },
            configurable: true,
            enumerable: true,
          });
        } catch {
          // Property may not be configurable — skip
        }
      }
    }
  }
}
