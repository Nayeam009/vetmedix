
# Permanent Fix: Duplicate React Instance (useState null crash)

## Exact Root Cause — Now Confirmed

The two error screenshots show two **different version hashes** on the chunk filenames:
- `chunk-PMKBOVCG.js?v=4112562a` — contains React core (`useState`)
- `chunk-LPF6KSF2.js?v=260f022a` — contains React DOM renderer (`renderWithHooks`)

These different hashes prove Vite is loading **two separately pre-bundled chunks of React** — one from before the config was fixed and one after. The dep-optimizer cache (`node_modules/.vite/deps/`) was never invalidated, so old stale chunks are still being served alongside the new ones.

The previous `vite.config.ts` edit was correct in removing the absolute path aliases, but it missed two critical things:
1. `optimizeDeps.force: true` — forces Vite to discard stale cache and re-bundle from scratch on next start
2. `react-dom` was missing from `optimizeDeps.include` — the renderer must be bundled in the same pass as the core
3. `react/jsx-runtime` missing from `manualChunks` — risk of a third instance in production builds

## What Changes

### `vite.config.ts` — 3 Targeted Fixes

**Fix 1: Add `optimizeDeps.force: true`**

This is the cache-buster. It tells Vite: "throw away everything in `node_modules/.vite/deps/` and re-bundle all dependencies from scratch on next startup." Without this, the stale chunks persist forever regardless of any other config change.

```typescript
optimizeDeps: {
  force: true, // ← CRITICAL: invalidates stale cache, forces fresh bundle
  include: [
    "react",
    "react-dom",        // ← ADD: was missing, renderer must be in same bundle pass
    "react/jsx-runtime",
    "@tanstack/react-query",
    "react-router-dom",
  ],
},
```

**Fix 2: Add `react-dom` to `optimizeDeps.include`**

`react-dom` contains `renderWithHooks` — the renderer. It must be pre-bundled in the same esbuild pass as `react` core so they share the same module instance. It was missing from the previous config.

**Fix 3: Add `react/jsx-runtime` to `manualChunks`**

The production build's `manualChunks` groups `react` and `react-dom` into `vendor-react`, but excludes `react/jsx-runtime`. This risks a split in production where JSX transform uses a different chunk. Add it to the same group:

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
  // ...
}
```

## Why `force: true` Is Safe

`optimizeDeps.force: true` only affects the development server's startup behavior — it does not affect production builds. The production build always re-bundles from scratch anyway. The only side effect is a slightly slower first cold-start after the config change (Vite needs to re-bundle), which then becomes normal speed on subsequent starts.

## File Change Summary

| File | Change | Effect |
|------|--------|--------|
| `vite.config.ts` | Add `optimizeDeps.force: true` | Busts stale dep cache permanently |
| `vite.config.ts` | Add `"react-dom"` to `optimizeDeps.include` | Renderer bundled with core in same pass |
| `vite.config.ts` | Add `"react/jsx-runtime"` to `manualChunks['vendor-react']` | Prevents third React instance in prod |

## Expected Result

After this fix:
- Vite discards the stale `chunk-PMKBOVCG.js` and `chunk-LPF6KSF2.js` chunks
- All of React (core + DOM + JSX runtime) is bundled into a **single pre-bundled chunk** in dev
- `AuthProvider`, `CartProvider`, `PetProvider` all call `useState` from the same React instance
- White screen crash is permanently resolved
- No changes to any component, context, or page files needed
