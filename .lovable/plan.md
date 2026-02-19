
# Fix: Duplicate React Instance — White Screen Crash

## Exact Root Cause

The error `TypeError: Cannot read properties of null (reading 'useState')` means two separate React module instances are loaded simultaneously. When `CartProvider` calls `useState` from instance A, but the renderer runs on instance B, React's internal dispatcher (`ReactCurrentDispatcher.current`) is `null` — causing the crash.

**Why the current fix is making it WORSE:**

The `vite.config.ts` previously added `resolve.alias` with **absolute filesystem paths** for `react`, `react-dom`, and `react/jsx-runtime`. In Vite dev mode (HMR), this interacts destructively with `optimizeDeps`:

```
Vite dep optimizer → pre-bundles "react" into chunk-PMKBOVCG.js  (instance A)
resolve.alias path → resolves react again at node_modules/react   (instance B)
```

Both instances end up in the module graph simultaneously. The `@vitejs/plugin-react-swc` plugin injects its own internal React transform that then references the wrong instance.

The **correct** Vite mechanism for this is:
- `resolve.dedupe` — tells Vite's module graph to de-duplicate these packages
- `optimizeDeps.include` — pre-bundles them together into one shared chunk
- **No** absolute path aliases for React (they bypass deduplication)

## What Changes

### 1. `vite.config.ts` — Remove Destructive Aliases, Keep Only Correct Dedupe

**Remove:** The `react`, `react-dom`, and `react/jsx-runtime` entries from `resolve.alias` (these are the problem).

**Keep:**
- `resolve.dedupe: ["react", "react-dom", "react/jsx-runtime"]` — the correct mechanism
- `optimizeDeps.include` — pre-bundles them together
- The `@` alias — unaffected

**Before (broken):**
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "react": path.resolve(__dirname, "./node_modules/react"),        // ← PROBLEM
    "react-dom": path.resolve(__dirname, "./node_modules/react-dom"), // ← PROBLEM
    "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"), // ← PROBLEM
  },
  dedupe: ["react", "react-dom", "react/jsx-runtime"],
},
```

**After (fixed):**
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    // React aliases removed — dedupe handles deduplication correctly
  },
  dedupe: ["react", "react-dom", "react/jsx-runtime"],
},
```

### 2. `optimizeDeps` — Force Re-Bundle

Also add `force: false` (default) but ensure `include` is comprehensive to guarantee all React consumers share the same pre-bundled instance:

```typescript
optimizeDeps: {
  include: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@tanstack/react-query",
    "react-router-dom",
  ],
},
```

### 3. `manualChunks` — Keep Existing Structure

The build-time `manualChunks` configuration is correct and stays unchanged.

## Why This Fixes It

| Mechanism | Role | Status After Fix |
|-----------|------|-----------------|
| `resolve.dedupe` | Tells Vite: "if any package imports react, always resolve to the SAME copy" | Kept ✓ |
| `optimizeDeps.include` | Pre-bundles React into ONE shared chunk in dev | Kept ✓ |
| `resolve.alias` (React) | Bypasses dedupe in dev, creates second instance | REMOVED ✓ |
| `manualChunks` | Groups React into single chunk for production build | Unchanged ✓ |

## Files Changed

| File | Change |
|------|--------|
| `vite.config.ts` | Remove `react`, `react-dom`, `react/jsx-runtime` from `resolve.alias`. Expand `optimizeDeps.include` to also cover `react-router-dom`. |

No other files need to change. The `CartContext`, `AuthContext`, and all other contexts are correctly written — only the Vite module resolution is broken.

## Expected Result After Fix

- App boots without white screen on both dev and production
- `CartProvider`, `AuthProvider`, `PetProvider` all use the same React instance
- HMR (hot reload) continues to work correctly
- No regression to the doctors page fix, mobile nav, or any other recent changes
