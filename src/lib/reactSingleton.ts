/**
 * React Singleton Guard
 * 
 * Safety net: if duplicate React instances exist despite optimizeDeps.force,
 * this patches ALL hook functions on secondary instances to delegate to the
 * canonical (first-loaded) React. This bypasses closure-captured dispatcher
 * references entirely.
 */

import React from "react";

if (typeof window !== "undefined") {
  const WIN = window as any;
  const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

  if (!WIN.__REACT_CANONICAL__) {
    // First React instance — store as canonical
    WIN.__REACT_CANONICAL__ = { React, internals };
  } else {
    // Secondary React instance detected — bridge everything to canonical
    const canonical = WIN.__REACT_CANONICAL__;
    const canonReact = canonical.React;
    const canonInternals = canonical.internals;

    // Strategy A: Proxy dispatcher objects
    for (const key of [
      "ReactCurrentDispatcher",
      "ReactCurrentBatchConfig",
      "ReactCurrentOwner",
    ] as const) {
      const canonObj = canonInternals?.[key];
      const localObj = internals?.[key];
      if (canonObj && localObj && canonObj !== localObj) {
        for (const prop of Object.keys(canonObj)) {
          try {
            Object.defineProperty(localObj, prop, {
              get() { return canonObj[prop]; },
              set(v) { canonObj[prop] = v; },
              configurable: true,
              enumerable: true,
            });
          } catch {
            // skip non-configurable
          }
        }
      }
    }

    // Strategy B: Replace hook functions directly (nuclear fallback)
    const hooks = [
      "useState", "useEffect", "useLayoutEffect", "useCallback",
      "useMemo", "useRef", "useContext", "useReducer",
      "useImperativeHandle", "useDebugValue", "useDeferredValue",
      "useTransition", "useId", "useSyncExternalStore",
      "useInsertionEffect", "createElement", "createContext",
    ] as const;

    for (const hook of hooks) {
      if (typeof (canonReact as any)[hook] === "function" &&
          (React as any)[hook] !== (canonReact as any)[hook]) {
        (React as any)[hook] = (canonReact as any)[hook];
      }
    }
  }
}
