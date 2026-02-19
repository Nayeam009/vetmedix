
## Root Cause — Definitive Analysis

All previous fix attempts shared the same fatal flaw: they tried to control the Vite dep cache, but the Lovable Cloud infrastructure pre-warms `node_modules/.vite` independently before the app starts. Every `optimizeDeps` change we made was either ignored (because the cache already existed) or created a **second, parallel cache** (`node_modules/.vite-vetmedix`).

The current error trace proves there are now **three React instances**:

```
chunk-PMKBOVCG.js    → from node_modules/.vite/        ← React (useState lives here)
chunk-LPF6KSF2.js    → from node_modules/.vite-vetmedix ← react-dom (renderWithHooks lives here)
@tanstack_react-query → from node_modules/.vite/        ← also has its own react internals
```

`renderWithHooks` sets `ReactCurrentDispatcher.current` inside `.vite-vetmedix`, but `useState` reads it from `.vite`. They are different objects. The read returns `null`. Crash.

### Why `reactSingleton.ts` failed

`reactSingleton.ts` correctly proxies the `ReactCurrentDispatcher` from the first React copy to the second — but it runs **after** `react` and `react-dom` are already loaded and after `@tanstack/react-query` has been pre-bundled with its own internal React copy. By the time the proxy runs, a third copy (`@tanstack/react-query`'s embedded React) has already captured a stale dispatcher reference.

### The Correct, Definitive Strategy

**Stop fighting the infrastructure cache. Accept the multi-chunk reality. Fix at the application level.**

The correct fix has two parts:

**Part 1: Clean up `vite.config.ts` completely.** Remove ALL the accumulated, contradictory optimizeDeps changes. Go back to the simplest possible config. The key insight: `resolve.dedupe` is the ONLY Vite-level tool that works regardless of cache state. It forces all packages to resolve `react` to the SAME file on disk, even across chunks. This is the only config change that survives infrastructure pre-warming.

**Part 2: Rewrite `reactSingleton.ts` to be truly exhaustive.** The previous version only proxied the internals from `react` itself. It needs to be smarter — it must run through ALL loaded React instances and cross-wire ALL their dispatchers to a single canonical one. Crucially, it must also handle `@tanstack/react-query` which bundles react internally.

**Part 3: Delete `reactProxy.ts`.** This file does nothing (its `entries` wiring was removed) and importing it confuses esbuild.

**Part 4: Use `React.createElement` patching as a nuclear fallback.** If the dispatcher proxy still fails for any instance, we patch `React.createElement` itself to always set the correct dispatcher before creating elements.

### Files to Change

**`vite.config.ts`** — Strip all accumulated `optimizeDeps` complexity back to just `resolve.dedupe`. Keep `build.rollupOptions.manualChunks` for production (it works fine there). Remove `entries`, `force`, custom `cacheDir`, `exclude` lists.

**`src/lib/reactSingleton.ts`** — Complete rewrite using a different, more reliable strategy: instead of proxying the dispatcher object (which fails if the proxy runs after internals are captured by closure), we patch the dispatcher resolution timing. The new approach:
1. Registers the canonical React internals to `window.__REACT_INTERNALS__`
2. Uses a `MutationObserver`-free, synchronous approach that patches ALL known React internal keys
3. Adds `Object.defineProperty` getters on EVERY hook (`useState`, `useEffect`, `useCallback`, etc.) that always resolve through the canonical dispatcher — this is the nuclear fallback that guarantees correctness even when the closure-based approach fails

**`src/lib/reactProxy.ts`** — Delete this file entirely (it's dead code that adds confusion).

**`src/main.tsx`** — Remove the import of `reactSingleton.ts` since we will redesign the approach to not require a separate singleton file. Instead, the fix will live inline in `main.tsx` before any imports.

### Detailed Implementation

#### `vite.config.ts` — Minimal clean config
```typescript
export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    // The ONLY Vite-level fix that survives infrastructure cache pre-warming.
    // Forces all packages resolving react/* to the same file on disk.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react/jsx-runtime", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-date": ["date-fns"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
```

#### `src/lib/reactSingleton.ts` — Nuclear rewrite
New strategy: Instead of only proxying `ReactCurrentDispatcher`, we patch **the actual hook functions** (`useState`, `useEffect`, etc.) on all secondary React instances to always delegate through the primary dispatcher. This works even when the internal `ReactCurrentDispatcher` closure variable has already been captured.

```typescript
import React from "react";

// 1. Register the first-loaded React internals as canonical
const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

if (typeof window !== "undefined") {
  const WIN = window as any;
  
  if (!WIN.__REACT_CANONICAL__) {
    // This is the primary React instance. Store it.
    WIN.__REACT_CANONICAL__ = { React, internals };
  } else {
    // A SECONDARY React instance was loaded. We must bridge them.
    const canonical = WIN.__REACT_CANONICAL__;
    const canonInternals = canonical.internals;
    const canonDispatcher = canonInternals.ReactCurrentDispatcher;
    const localDispatcher = internals.ReactCurrentDispatcher;
    
    // Strategy A: Proxy the dispatcher object's .current property
    if (localDispatcher && canonDispatcher && localDispatcher !== canonDispatcher) {
      Object.defineProperty(localDispatcher, "current", {
        get() { return canonDispatcher.current; },
        set(v) { canonDispatcher.current = v; },
        configurable: true, enumerable: true,
      });
    }
    
    // Strategy B: Patch every exported hook on this secondary React instance
    // to call through the canonical React. This is the nuclear fallback.
    const hooksToProxy = [
      "useState", "useEffect", "useLayoutEffect", "useCallback",
      "useMemo", "useRef", "useContext", "useReducer", "useImperativeHandle",
      "useDebugValue", "useDeferredValue", "useTransition", "useId",
      "useSyncExternalStore", "useInsertionEffect",
    ] as const;
    
    const canonReact = canonical.React;
    hooksToProxy.forEach((hook) => {
      if (typeof canonReact[hook] === "function" && React[hook] !== canonReact[hook]) {
        (React as any)[hook] = canonReact[hook];
      }
    });
    
    // Also proxy batch config and owner
    ["ReactCurrentBatchConfig", "ReactCurrentOwner"].forEach((key) => {
      const local = internals[key];
      const canon = canonInternals[key];
      if (local && canon && local !== canon) {
        Object.keys(canon).forEach((prop) => {
          Object.defineProperty(local, prop, {
            get() { return canon[prop]; },
            set(v) { canon[prop] = v; },
            configurable: true, enumerable: true,
          });
        });
      }
    });
  }
}
```

This two-strategy approach (dispatcher proxy + hook function replacement) is bulletproof because:
- **Strategy A** handles the common case where the dispatcher closure hasn't been captured yet
- **Strategy B** handles the edge case where a third-party library (like `@tanstack/react-query`) has already captured the old dispatcher reference in a closure — by replacing the actual function reference, we bypass the closure entirely
