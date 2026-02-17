
# Deep System Audit: Critical Issues Report

## 1. BUGS (Logic Gaps & Security)

### BUG-1: Comment Count Not Updated Optimistically (Medium)
**File**: `src/hooks/useComments.ts` + `src/hooks/usePosts.ts`

When a user posts a comment, the `useComments` hook appends it to the local comments list (line 76), but the parent `PostCard` still shows the old `post.comments_count` from the `usePosts` state. The count only updates on a full page refresh or feed re-fetch. This breaks the "instant feedback" expectation.

**Root cause**: `useComments.addComment()` doesn't notify `usePosts` to increment `comments_count`. The `update_post_comments_count` trigger updates the DB, but the local React state in `usePosts` is stale.

**Fix**: After a successful comment insert, call a callback (passed from PostCard) that increments `comments_count` locally in the `usePosts` state, mirroring the optimistic like pattern.

### BUG-2: Console Ref Warning from DropdownMenu (Low)
**File**: `src/components/social/PostCard.tsx`

The console shows: `"Function components cannot be given refs"` from `PostCardComponent`. The `DropdownMenu` component (Radix) attempts to set a ref on itself. When rendered inside `BelowFoldContent.tsx` (home page), the Tabs component passes a ref down through `TabsContent`, which propagates to child components. The `DropdownMenu` root is a function component that doesn't accept refs.

**Fix**: Wrap the `DropdownMenu` in a `<div>` to absorb the stray ref, preventing it from reaching the function component.

### BUG-3: No Route Guard on Clinic/Doctor Dashboards (Verified Safe)
**Status**: NOT A BUG

- `ClinicDashboard` checks `isClinicOwner`, `isAdmin`, and `ownedClinic` before rendering (line 185). Pet Parents see "Access Denied."
- `DoctorDashboard` checks `isDoctor` role (line 84). Pet Parents see "Access Denied."
- Admin routes use `RequireAdmin` wrapper which redirects non-admins.
- RLS policies enforce server-side data isolation regardless of client routing.

---

## 2. PERFORMANCE

### PERF-1: Comment Count Stale Until Re-fetch (Tied to BUG-1)
The `comments_count` on posts only refreshes when the entire feed re-fetches. This creates a perceived "lag" where the count badge shows "View all 3 comments" even after posting a 4th.

### PERF-2: All Items Verified as Optimized
- All 50+ routes use `React.lazy()` with `Suspense` -- PASS
- `PostCard` uses `memo()` with custom comparator -- PASS
- Feed uses `contentVisibility: auto` for virtualization -- PASS
- TanStack Query: `staleTime: 2min`, `gcTime: 10min` -- PASS
- Realtime subscriptions use invalidation-over-payload -- PASS
- `console.log` calls: all guarded by `import.meta.env.DEV` -- PASS
- No heavy unloaded components found; clinic charts are lazy-loaded

### PERF-3: Dead Code Scan
No unused components or zombie code found in the main `/src` directory. The previous `category` state was already removed in the Gold Master phase.

---

## 3. UX / MOBILE

### UX-1: All Mobile Checks Pass
- Touch targets: 44x44px enforced globally via CSS + individual component `min-h-[44px]` / `min-w-[44px]` -- PASS
- iOS auto-zoom: All inputs use `text-base` on mobile (16px) -- PASS
- Horizontal overflow: No `body` overflow-x issues; tables use card views -- PASS
- Admin sidebar: `Sheet` drawer on mobile, auto-closes on link click -- PASS
- Bottom nav: 44px touch targets with `active:bg-primary/10` feedback -- PASS

### UX-2: Comment "Like" and "Reply" Buttons Are Placeholder (Info)
**File**: `src/components/social/CommentsSection.tsx` (lines 115-127)

The "Like" and "Reply" buttons on comments show `toast.info('Coming soon!')`. These are not bugs but incomplete features. They have proper 44x44px touch targets.

---

## Summary

| ID | Category | Severity | File | Description |
|----|----------|----------|------|-------------|
| BUG-1 | Bug | Medium | usePosts.ts, PostCard.tsx, CommentsSection.tsx | Comment count not optimistically updated in feed |
| BUG-2 | Bug | Low | PostCard.tsx | Console ref warning from DropdownMenu in Tabs context |
| PERF-1 | Perf | Low | (Tied to BUG-1) | Stale comment count until re-fetch |
| UX-2 | Info | None | CommentsSection.tsx | Like/Reply on comments are placeholder |

## Proposed Fixes (2 items)

### Fix for BUG-1 + PERF-1: Optimistic Comment Count
1. Add an `onCommentAdded` callback prop to `CommentsSection`.
2. In `PostCard`, pass a handler that locally increments `comments_count` on the post.
3. Propagate this through the `usePosts` hook by exposing an `updatePostCommentCount(postId, delta)` function.
4. Same pattern for comment deletion (decrement).

### Fix for BUG-2: Silence Ref Warning
1. In `PostCard.tsx`, wrap the `DropdownMenu` in a plain `<div>` to absorb the ref passed by Radix TabsContent.

Total: 2 files modified, 0 new dependencies, 0 database changes.
