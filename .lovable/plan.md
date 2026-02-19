# Comprehensive Codebase Audit Report

## Executive Summary

The codebase is architecturally well-structured with many good practices already in place (optimistic updates, React Query caching, memoized components, error boundaries). However, the audit has identified **one critical infrastructure bug** causing the white screen, **three high-severity issues**, **four medium-severity issues**, and **three low-severity issues** that need to be resolved to achieve full stability.

---

## CRITICAL: The Root Cause of the useState White Screen Crash

**Finding:** The error stack trace reveals two different version hashes for the same session:

- `chunk-PMKBOVCG.js?v=0f21b65e` (contains the `useState` export)
- `chunk-TKA7E7G6.js?v=4112562a` (contains `renderWithHooks`, the React DOM renderer)

These two hashes do not match, which is the definition of a **duplicate React instance**. React DOM's `renderWithHooks` sets an internal dispatcher on a `ReactCurrentDispatcher` object owned by its own copy of React core. When `CartContext.tsx` calls `useState`, it resolves to a *different* copy of React core (via `chunk-PMKBOVCG.js`) whose dispatcher was never initialized — so it is `null`. This is a **Vite dev-server pre-bundling infrastructure problem**, not a code bug.

**Root Cause:** Vite's pre-bundler (`esbuild`) ran in two separate passes — one for React core (`react`, `react/jsx-runtime`) and one for React DOM. Because they ran in separate passes, they produced separate output chunks with separate content hashes. The browser then loaded two chunks with two separate `ReactCurrentDispatcher` singletons.

**The Definitive Fix:**

All previous attempts have modified `vite.config.ts` without addressing the core issue. The real solution is to ensure React core and React DOM are always co-bundled in the **exact same esbuild invocation**. The fix requires:

1. Removing `force: true` from `optimizeDeps` — this flag re-runs the pre-bundler on *every* server start, which is counterproductive and is the exact mechanism that keeps regenerating mismatched chunks during a live session.
2. Removing the `esbuildOptions.banner` — the banner changes chunk content hashes, which is causing the browser to fetch stale mismatched versions from the infrastructure cache.
3. Removing the custom `cacheDir: ".vite-cache-v3"` — custom cache dirs are not recognized by the Lovable Cloud infrastructure's pre-warming step, so the deps cache is always empty on start, causing two-pass bundling.
4. Keeping `resolve.dedupe` for React packages — this is the correct, low-level guarantee.
5. Keeping the `optimizeDeps.include` list but **removing** `force: true` so Vite caches the result.

---

## HIGH SEVERITY Issues

### H-1: Memory Leak in `useConversations` (useMessages.ts)

**Location:** `src/hooks/useMessages.ts`, lines 12-80

**Finding:** The `fetchConversations` function is defined inside the hook body without `useCallback`. It is then called inside a `useEffect` with `[user]` as a dependency — but `fetchConversations` itself is not in the dependency array. This is a React Hook rules violation flagged by ESLint (`react-hooks/exhaustive-deps`). More critically, for each conversation in the list, the hook fires **3 sequential `await` database calls** inside a `Promise.all`:

1. Fetch pets for the other user
2. Fetch the last message
3. Count unread messages

For a user with 20 conversations, this creates **60 sequential Supabase round-trips** on every mount. There is no abort controller or cleanup, so if the component unmounts mid-fetch, every pending promise will still attempt to call `setConversations` on an unmounted component, causing a state-update-after-unmount memory leak.

**Solution:** Wrap `fetchConversations` in `useCallback([user])`, add an `AbortController`/`isMounted` ref, and replace the 3-per-conversation queries with a single SQL join query or a Supabase RPC function.

---

### H-2: `PetContext` refreshPets Has a Stale Closure / Missing Dependency

**Location:** `src/contexts/PetContext.tsx`, lines 22-57

**Finding:** The `refreshPets` function is defined as a regular `async function` (not `useCallback`), yet it is listed in the Provider's value and called from `useEffect([user])`. The function closes over `activePet` at definition time (line 43: `if (petsData.length > 0 && !activePet)`). Because `refreshPets` is recreated on every render but `activePet` is stale inside the old reference, calling `refreshPets` from a child component after the first pet is selected will always see `activePet` as `null` (its initial value from the previous render closure), potentially resetting the active pet selection unexpectedly.

**Solution:** Wrap `refreshPets` in `useCallback` with `[user, activePet]` as dependencies, or use a functional state update pattern that reads the current value of `activePet` from a ref.

---

### H-3: Unhandled Null Response and Missing Error Feedback in `useNotifications` / `useStories`

**Location:** `src/hooks/useNotifications.ts` (line 18), `src/hooks/useStories.ts` (lines 16, 30)

**Finding 1 (useNotifications):** The query fetches from `'notifications' as any` with a joined `actor_pet:pets!notifications_actor_pet_id_fkey(*)`. If this FK relationship does not exist (or if `actor_pet_id` is null), the PostgREST join will either throw or return null. The `markAsRead` and `markAllAsRead` functions fire `await supabase...update(...)` without checking the returned `error` object. A failed update (e.g., RLS rejection) will silently fail while the optimistic UI shows the notification as read.

**Finding 2 (useStories):** The hook queries `story_views as any`, meaning the TypeScript type system provides zero safety. If the `story_views` table does not exist in the deployed schema, the entire stories feature silently fails with an empty array and no error toast. The `markAsViewed` function catches errors silently with a comment of "Ignore duplicate errors" but this also swallows real errors.

**Solution:** Replace `as any` casts with proper typed table names. Add error handling with user-facing feedback on `markAsRead` failures. Add a distinction between "duplicate" errors (code `23505`) and genuine failures.

---

### H-4: `PostCard` Bookmark is Fake — Data is Lost on Remount

**Location:** `src/components/social/PostCard.tsx`, lines 36, 253-258

**Finding:** The `isBookmarked` state is local to the `PostCard` component with no persistence: `const [isBookmarked, setIsBookmarked] = useState(false)`. When the component unmounts and remounts (e.g., feed refresh, tab switch), the bookmark state is lost. The user sees a success toast ("Saved to collection") but the data is never written to any database table. There is no `bookmarks` or `saved_posts` table in the schema. This is a **broken feature masquerading as a working one** — it creates false user expectations.

**Solution:** Either remove the bookmark UI entirely until a `saved_posts` table is created and the feature is fully implemented, or replace the `useState` with a proper database-backed hook.

---

## MEDIUM SEVERITY Issues

### M-1: `AuthContext` Double-Fires State Updates on Every Auth Event

**Location:** `src/contexts/AuthContext.tsx`, lines 27-53

**Finding:** The `useEffect` sets up `onAuthStateChange` (which fires immediately with the current session, setting state) AND then also calls `supabase.auth.getSession()` (which fires again, setting state a second time). On every page load, every child of `AuthProvider` re-renders **twice**: once from the listener and once from `getSession`. This causes two render cycles for every context consumer (`CartProvider`, `WishlistProvider`, `PetProvider`, etc.) on app startup.

**Solution:** Use only `onAuthStateChange` and remove the redundant `getSession()` call. The `INITIAL_SESSION` event from `onAuthStateChange` already provides the initial session reliably.

---

### M-2: `useComments` Has No Real-Time Subscription

**Location:** `src/hooks/useComments.ts`, lines 38-40

**Finding:** Comments are fetched once on mount (`useEffect([postId])`). If another user posts a comment on the same post while the current user is viewing the comments section, the new comment does not appear without a manual page refresh. The `PostCard` wraps `CommentsSection` and the `PostCardSkeleton` shows a loading skeleton — but once loaded, the comments list is effectively static. Meanwhile, `useNotifications` and `useMessages` both implement real-time subscriptions correctly, creating an inconsistent experience.

**Solution:** Add a Supabase `postgres_changes` subscription inside `useComments` for `INSERT` events on the `comments` table, filtered by `post_id=eq.${postId}`, matching the pattern already used in `useNotifications`.

---

### M-3: `useAdminOrders` and `useAdminUsers` Have No Pagination — 1000 Row Supabase Limit

**Location:** `src/hooks/useAdmin.ts`, lines 79-109 and 111-140

**Finding:** Both `useAdminOrders` and `useAdminUsers` call `.select()` without a `.limit()` or `.range()`. Supabase's default query limit is **1000 rows**. If the platform grows beyond 1000 orders or users (which is the goal of a growing e-commerce platform), these queries will silently truncate results. An admin reviewing "all orders" would only see the first 1000, with no indication that more exist. This is a **data completeness bug** that becomes a business logic bug at scale.

**Solution:** Implement server-side pagination using `.range(from, to)` combined with a total count query using `{ count: 'exact', head: true }`. Add pagination UI to the admin tables.

---

### M-4: `CartContext` — `totalItems` and `totalAmount` Are Recomputed on Every Render

**Location:** `src/contexts/CartContext.tsx`, lines 72-73

**Finding:** The computed values `totalItems` and `totalAmount` are calculated directly in the render body of `CartProvider`:

```tsx
const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
```

These `.reduce()` calls run on every single render of `CartProvider`, including renders triggered by unrelated state changes in parent providers. With many cart items, this is wasted computation. Since these values are passed to the context, every consumer also re-renders whenever the provider re-renders, even if `items` hasn't changed.

**Solution:** Wrap both computed values in `useMemo([items])`.

---

## LOW SEVERITY Issues

### L-1: `PostCard` — Share URL Points to a Non-Existent Route

**Location:** `src/components/social/PostCard.tsx`, line 82

**Finding:** The share handler constructs a URL: `const shareUrl = \`${window.location.origin}/post/${post.id}`. Looking at` App.tsx`, there is no route defined for` /post/:id`. The URL shared to other users or copied to clipboard leads to the **404 Not Found** page. This is a broken social sharing feature.

**Solution:** Either add a route `/post/:id` in `App.tsx` that renders a single-post view, or change the share URL to point to the author's pet profile: `/pet/${post.pet_id}`.

---

### L-2: `useConversations` Not Using React Query — No Cache Sharing

**Location:** `src/hooks/useMessages.ts`, lines 7-118

**Finding:** `useConversations` uses raw `useState` + `useEffect` instead of `useQuery`. This means:

- Every mount of `MessagesPage` fires fresh network requests
- There is no shared cache between `MessagesPage` and `NotificationBell` (if it shows message counts)
- The `staleTime` optimization from the global `QueryClient` config (`2 minutes`) is bypassed entirely
- This is inconsistent with all other data-fetching hooks that use React Query

**Solution:** Migrate `useConversations` to `useQuery` with a key like `['conversations', user?.id]`.

---

### L-3: `useStories` — `fetchStories` Is Not Wrapped in `useCallback`

**Location:** `src/hooks/useStories.ts`, lines 13-76

**Finding:** `fetchStories` is a plain `async function` defined inside the hook. It is called in `useEffect([user])` directly. However, it closes over `user` from its outer scope. Because it is not memoized:

- It creates a new function reference on every render
- It cannot be safely passed to child components or used as a dependency
- The `refresh: fetchStories` exposed in the hook's return value is a new function reference on every render, which could cause unnecessary re-renders in any component that uses it as a `useCallback` dependency

**Solution:** Wrap `fetchStories` in `useCallback([user])`.

---

## Implementation Order (Priority Queue)

```text
PRIORITY 1 (Do first — blocks all users)
  └── CRITICAL: Fix vite.config.ts to stop force-rebuilding on every start
      Remove: force: true, esbuildOptions.banner, cacheDir: ".vite-cache-v3"
      Keep:   resolve.dedupe, optimizeDeps.include

PRIORITY 2 (Fix next — correctness & data integrity)
  └── H-1: Fix useConversations memory leak + N+1 query pattern
  └── H-2: Wrap PetContext refreshPets in useCallback
  └── H-3: Add error handling to markAsRead / fix story_views as any
  └── H-4: Remove fake bookmark feature or implement it properly

PRIORITY 3 (Fix after — user experience)
  └── M-1: Remove redundant getSession() call from AuthContext
  └── M-2: Add real-time comment subscription to useComments
  └── M-3: Add pagination to admin orders and users queries
  └── M-4: Wrap CartContext totals in useMemo

PRIORITY 4 (Fix last — polish)
  └── L-1: Fix share URL to point to existing route
  └── L-2: Migrate useConversations to React Query
  └── L-3: Wrap useStories fetchStories in useCallback
```

&nbsp;

&nbsp;

```
**Task:** Implement the fixes identified in the codebase audit. 

**Execution Rules:**
1.  **Step-by-Step:** Do not fix everything at once. We will implement the fixes incrementally to avoid breaking working features [14, 15]. Start with the most critical "High Risk" issue you identified.
2.  **Fragile Update Protocol:** This is a delicate update. Carefully examine all related code and dependencies before making changes [16, 17]. Avoid any modifications to unrelated components or files [17].
3.  **Root Cause Resolution:** Ensure you are addressing the underlying root cause of the logic bug, not just silencing a console error symptom [18].
4.  **Progressive Enhancement:** If implementing error boundaries or fallbacks, utilize shadcn/ui components (like `Alert`, `Toast`, or `Skeleton`) to ensure a polished user experience [19, 20].

Please implement the first critical fix now. Once completed and verified, summarize what the issue was and how we fixed it [21].
```