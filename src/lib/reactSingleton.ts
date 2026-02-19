/**
 * React Singleton Guard — Definitive Fix for Duplicate React Instance
 *
 * Root cause (confirmed via stack trace analysis):
 *   chunk-PMKBOVCG.js  = react bundle  → own ReactCurrentDispatcher + useState
 *   chunk-LPF6KSF2.js  = react-dom bundle → own ReactCurrentDispatcher + renderWithHooks
 *
 *   renderWithHooks (LPF6KSF2) sets   LPF6KSF2.ReactCurrentDispatcher.current = HooksDispatcher
 *   useState        (PMKBOVCG) reads  PMKBOVCG.ReactCurrentDispatcher.current  → still null → CRASH
 *
 * Why previous fixes failed:
 *   The old guard swapped `internals.ReactCurrentDispatcher` (the export-object property),
 *   but useState uses a LOCAL CLOSURE VARIABLE inside the chunk — the swap had zero effect.
 *
 * This fix:
 *   react-dom exports __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED which contains
 *   its own bundled ReactCurrentDispatcher (the one renderWithHooks writes to).
 *   We use Object.defineProperty to proxy PMKBOVCG's ReactCurrentDispatcher.current
 *   getter/setter to always read/write through LPF6KSF2's dispatcher.
 *   Now both chunks share one dispatcher value regardless of esbuild chunk splitting.
 */

import React from "react";
// Import react-dom (not /client) to access its __SECRET_INTERNALS which contains
// the ReactCurrentDispatcher that renderWithHooks actually writes to.
import * as ReactDOMNamespace from "react-dom";

type SharedInternals = {
  ReactCurrentDispatcher: { current: unknown };
  ReactCurrentBatchConfig: { transition: unknown };
  ReactCurrentOwner: { current: unknown };
};

const reactInternals = (React as any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as SharedInternals;

const rdInternals = (ReactDOMNamespace as any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as SharedInternals | undefined;

if (typeof window !== "undefined") {
  if (rdInternals) {
    const reactDispatcher = reactInternals?.ReactCurrentDispatcher;
    const rdDispatcher    = rdInternals?.ReactCurrentDispatcher;

    if (reactDispatcher && rdDispatcher && reactDispatcher !== rdDispatcher) {
      // Two separate ReactCurrentDispatcher objects detected.
      // Proxy react's .current so it always mirrors react-dom's .current.
      // renderWithHooks writes to rdDispatcher.current → useState reads it ✓
      Object.defineProperty(reactDispatcher, "current", {
        get()  { return rdDispatcher.current; },
        set(v) { rdDispatcher.current = v;    },
        configurable: true,
        enumerable:   true,
      });

      // Also bridge ReactCurrentOwner (used by JSX createElement)
      const reactOwner = reactInternals?.ReactCurrentOwner;
      const rdOwner    = rdInternals?.ReactCurrentOwner;
      if (reactOwner && rdOwner && reactOwner !== rdOwner) {
        Object.defineProperty(reactOwner, "current", {
          get()  { return rdOwner.current; },
          set(v) { rdOwner.current = v;    },
          configurable: true,
          enumerable:   true,
        });
      }

      // Bridge ReactCurrentBatchConfig.transition (used by useTransition)
      const reactBatch = reactInternals?.ReactCurrentBatchConfig;
      const rdBatch    = rdInternals?.ReactCurrentBatchConfig;
      if (reactBatch && rdBatch && reactBatch !== rdBatch) {
        Object.defineProperty(reactBatch, "transition", {
          get()  { return rdBatch.transition; },
          set(v) { rdBatch.transition = v;    },
          configurable: true,
          enumerable:   true,
        });
      }
    }
  }
}
