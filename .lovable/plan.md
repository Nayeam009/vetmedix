
# Full Regression & Audit Report — VetMedix

## Executive Summary

The previous audit's fixes have been correctly implemented in the code: `AuthContext`, `CartContext`, `PetContext`, `PostCard`, `useComments`, `useNotifications`, `useStories`, `useMessages`, and `useAdmin` all show the correct, hardened implementations. However, the duplicate React instance error **persists** because the root fix strategy is contradictory, and two new issues have been introduced. This report identifies every remaining bug, ordered by severity.

---

## CRITICAL-1: The useState/useEffect Crash — Root Cause Is Still Present

**The error reported:**
```
chunk-PMKBOVCG.js?v=4112562a  — useState is null
chunk-LPF6KSF2.js?v=0e4f4a97  — renderWithHooks
```

**Diagnosis via chain-of-thought:**

The stack trace shows the *preview environment* (`lovableproject.com`), not the published build (`lovable.app`). The published build uses `vendor-react-DAHpftMA.js` — a single unified chunk — which is working. The crash only happens in the **Lovable Cloud dev-preview iframe**, where Vite's pre-bundler runs independently of the `manualChunks` production config.

The current `vite.config.ts` has an internal contradiction that perpetuates the crash:

- `resolve.dedupe: ["react", "react-dom", "react/jsx-runtime"]` — correct, ensures the same file is resolved.
- `optimizeDeps.include: [...]` without `force: true` — correct in theory, but the Lovable Cloud preview infrastructure pre-warms the dep cache before the app starts. This pre-warming runs esbuild in **two separate passes**: one for `react/react/jsx-runtime` and one for `react-dom` (because `@tanstack/react-query`, `react-router-dom`, etc. each pull in `react-dom` independently). Result: two separate chunks with mismatched hashes, two `ReactCurrentDispatcher` singletons.
- `src/lib/reactProxy.ts` exists (`import React from 'react'; import ReactDOM from 'react-dom'`) but is **not referenced anywhere in `vite.config.ts`**. There is no `optimizeDeps.entries` field pointing to it. The file is therefore completely dead code — esbuild never processes it as the co-bundling entry point it was designed to be.
- `src/lib/reactSingleton.ts` IS imported in `main.tsx` as the first line. This is the correct runtime safety net. However, it only works if `reactSingleton` itself imports from a React that has already been initialized. If the infrastructure pre-warms the cache with a chunk that has `ReactCurrentDispatcher: null`, the singleton guard runs but there is nothing valid to copy — it copies `null` from the stale chunk.

**The definitive fix requires two simultaneous changes:**

1. Wire `reactProxy.ts` into `optimizeDeps.entries` so esbuild is forced to process `react` + `react-dom` in a single co-bundled pass:
   ```ts
   optimizeDeps: {
     entries: ["src/lib/reactProxy.ts", "src/main.tsx"],
     include: [...existing list...]
   }
   ```
2. Keep `resolve.dedupe` and `reactSingleton.ts` as the runtime fallback.

---

## CRITICAL-2: `ProfilePage` Chunk-Load Failure — Stale Asset Hash in Production

**Console log from the user's preview:**
```
TypeError: Failed to fetch dynamically imported module:
https://...lovable.app/assets/ProfilePage-nMbYVXKw.js
```

**Diagnosis:**

This error comes from the **published production build** (`lovable.app`), not the dev preview. It means:

- The app was previously published with `ProfilePage-nMbYVXKw.js` as the lazy-loaded chunk name.
- A subsequent code change was published, which changed the content hash to a new value (e.g., `ProfilePage-ABCDEFG.js`).
- A user who has the **old HTML cached** in their browser still requests `ProfilePage-nMbYVXKw.js` — which no longer exists on the CDN — causing a fetch failure and a blank screen for that route.

This is a **cache invalidation problem** that occurs after every publish that changes the ProfilePage chunk. It is caught by `ErrorBoundary` but currently shows an error card instead of recovering automatically.

**Root cause in code:** The `ErrorBoundary` component (line 48-50) only offers manual retry. It does not detect the specific `Failed to fetch dynamically imported module` error and auto-recover with a hard reload, which is the standard industry fix for this problem.

**Fix:** In `ErrorBoundary.componentDidCatch`, detect chunk-load errors by checking if the error message includes `"Failed to fetch dynamically imported module"` or `"Loading chunk"` and automatically call `window.location.reload()` on first occurrence (using `sessionStorage` to prevent reload loops).

---

## HIGH-1: `AdminOrders` Page Does Not Pass `page` Parameter — Pagination Is Broken

**Location:** `src/pages/admin/AdminOrders.tsx`, line 84

**Finding:**

`useAdminOrders` was updated in the audit to support server-side pagination via `(page = 0, pageSize = 50)` parameters. The function correctly uses `.range(from, to)`. However, the `AdminOrders` page calls it with **no arguments**:

```tsx
const { data: ordersData, isLoading } = useAdminOrders();
// Called with page=0, pageSize=50 — always fetches page 0
```

There is no pagination state wired in `AdminOrders.tsx`. The page renders a filter bar, a search bar, and a status filter — all of which apply to only the first 50 orders. Orders 51-N are invisible to the admin. This means the pagination feature exists in the hook but is completely unused by the page. The admin sees at most 50 orders with no way to navigate to more.

**Secondary issue:** `AdminCustomers.tsx` has the same problem — line 66 calls `useAdminUsers()` with no page argument.

**Fix:** Add a `page` state variable to both admin pages and wire it to the hook, then render pagination controls using the existing `usePagination` hook (already imported in `AdminCustomers.tsx`).

---

## HIGH-2: `reactProxy.ts` Is Dead Code — Not Connected to Vite Config

**Location:** `src/lib/reactProxy.ts` + `vite.config.ts`

**Finding:**

`src/lib/reactProxy.ts` was created with the explicit intent to force esbuild to co-bundle `react` and `react-dom` in one pass. The file's own comment states:
> "This file is referenced by the vite.config.ts `optimizeDeps.entries` option"

But examining `vite.config.ts` shows there is **no `optimizeDeps.entries` field at all**. The file is never read by esbuild during dependency pre-bundling. It is imported nowhere in the application itself either. It achieves nothing.

This is a configuration bug introduced by a previous fix attempt. The intent was correct but the wiring was never completed.

---

## MEDIUM-1: `useAdminUsers` Fetches All `user_roles` Without Pagination — O(N) Memory Leak

**Location:** `src/hooks/useAdmin.ts`, line 140

**Finding:**

Inside `useAdminUsers`, the roles fetch is:
```ts
const { data: roles } = await supabase.from('user_roles').select('user_id, role');
```

This fetches **every role row in the entire database** without any `.range()` or `.in()` filter. If the platform has 5,000 users, this returns up to 5,000 role rows (Supabase 1000-row limit) on every paginated user query. The roles are then joined in memory.

**Fix:** Filter the roles query to only fetch roles for the user IDs in the current page:
```ts
const userIds = profiles?.map(p => p.user_id) || [];
const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);
```

---

## MEDIUM-2: `usePosts` — No `isMounted` Guard on Async Fetch

**Location:** `src/hooks/usePosts.ts`, lines 32-119

**Finding:**

`fetchPage` is a `useCallback` that fires async Supabase queries, then calls `setPosts`, `setLoading`, `setLoadingMore`, and `setHasMore`. There is no `isMountedRef` guard. If the user navigates away from the `FeedPage` while a fetch is in progress (e.g., during the `likePost` query), the callback will still attempt to call `setLoadingMore(false)` on an unmounted component. React 18 suppresses the warning but the state updates still execute on a dead component tree, which is wasted work and a memory leak for large feeds.

The `useMessages` hook correctly uses `isMountedRef` — `usePosts` should follow the same pattern.

---

## MEDIUM-3: `WishlistContext` — Supabase Errors Are Silently Swallowed

**Location:** `src/contexts/WishlistContext.tsx`, lines 34, 70-78

**Finding:**

Two `catch` blocks are completely empty:
```ts
} catch {
  // silently fail
}
```
and the `toggleWishlist` revert:
```ts
} catch {
  // Revert on error — no user feedback
}
```

If an RLS policy blocks the insert (e.g., user not authenticated, or a quota limit), the wishlist button will flash optimistically and then silently revert with no toast notification. The user has no idea their action failed. This violates the "Progressive Enhancement" rule from the audit brief.

**Fix:** Add `toast.error('Failed to update wishlist')` inside both catch blocks.

---

## LOW-1: `reactProxy.ts` Imports `react-dom` (Non-Client) — Wrong Import Path

**Location:** `src/lib/reactProxy.ts`, line 14

**Finding:**

```ts
import ReactDOM from 'react-dom';
```

The app uses React 18 with `createRoot` from `react-dom/client`. The correct package for React 18 rendering is `react-dom/client`, not the legacy `react-dom`. While they share the same underlying module, importing the wrong path can cause esbuild to treat them as separate dependency entries and produce separate chunks — which is the exact problem this file is supposed to prevent.

**Fix:** Change line 14 to `import ReactDOM from 'react-dom/client'` and add `react-dom/client` to the `optimizeDeps.entries` list.

---

## LOW-2: `AdminOrders` — `selectedPendingOrders` Is Referenced Before Declaration

**Location:** `src/pages/admin/AdminOrders.tsx`, line 172

**Finding:**

`handleBulkShip` at line 171 references `selectedPendingOrders`:
```ts
if (!selectedPendingOrders.length) return;
```
But `selectedPendingOrders` is a `useMemo` that is defined later in the file at approximately line 155+. JavaScript hoisting applies to `const` declarations — they are in the temporal dead zone until their line is reached. However, since `handleBulkShip` is an `async function` defined after the `useMemo`, this works at runtime because the function is not called during render. This is confusing code organization that could cause bugs if the order is changed during future refactoring. The `useMemo` should be defined before the function that uses it.

---

## Implementation Order (Priority Queue)

```text
PRIORITY 1 — Fix the white screen crash (blocks all users)
  CRITICAL-1: Add optimizeDeps.entries to vite.config.ts pointing to reactProxy.ts
  HIGH-2:     Wire the entries — reactProxy.ts is currently dead code

PRIORITY 2 — Fix the chunk-load production crash (breaks navigation for cached users)
  CRITICAL-2: Update ErrorBoundary to auto-reload on "Failed to fetch dynamically
              imported module" errors, using sessionStorage to prevent reload loops

PRIORITY 3 — Fix admin data completeness
  HIGH-1:     Add page state + pagination UI to AdminOrders.tsx and AdminCustomers.tsx
  MEDIUM-1:   Scope the user_roles query in useAdminUsers to current page user IDs

PRIORITY 4 — Fix silent failures & memory leaks
  MEDIUM-2:   Add isMountedRef to usePosts.fetchPage
  MEDIUM-3:   Add toast.error() to WishlistContext catch blocks

PRIORITY 5 — Polish
  LOW-1:      Fix reactProxy.ts import to use react-dom/client
  LOW-2:      Move selectedPendingOrders useMemo above handleBulkShip
```
