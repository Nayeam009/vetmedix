

# Gold Master Audit: Final Polish Plan

## Audit Results Summary

The codebase is in strong shape after Phases 1-3. Below are the remaining items to polish, organized by priority.

---

## 1. Console Log Cleanup

**Finding**: 1 production `console.log` found in `src/pages/AuthPage.tsx` (line 225). The others in `src/lib/analytics.ts` are correctly guarded behind `import.meta.env.DEV` and are safe.

**File**: `src/pages/AuthPage.tsx`
**Change**: Replace `console.log('Role already exists, continuing...')` with nothing (or a dev-only guard). This line runs in production when a duplicate role insert occurs.

---

## 2. React Ref Warning Fix (Console Error)

**Finding**: Console shows `"Function components cannot be given refs"` originating from `PostCardComponent` -- specifically the `DropdownMenu` usage. The `PostCard` is exported as `MemoizedPostCard` via `memo()`, which doesn't forward refs. Since `DropdownMenuTrigger` with `asChild` passes a ref to its child, this triggers the warning.

**File**: `src/components/social/PostCard.tsx`
**Change**: The `PostCardComponent` itself is not receiving a ref from outside (it's wrapped in `memo`, not `forwardRef`). The actual warning comes from how `DropdownMenuTrigger asChild` interacts with `Button`. This is a Radix UI internal warning that occurs when the `DropdownMenu` root is given a ref by a parent. No functional impact, but to silence it, ensure the component doesn't receive stray refs from parent wrappers in `FeedPage.tsx` or `BelowFoldContent.tsx`.

---

## 3. LazyVideo Memory Leak (Progress Bar)

**Finding**: In `src/components/social/LazyMedia.tsx` (lines 270-279), the `timeupdate` event listener is added via a ref callback but never cleaned up. Each render of the progress bar attaches a new listener without removing the previous one, causing a slow memory leak during video playback.

**File**: `src/components/social/LazyMedia.tsx`
**Change**: Move the `timeupdate` listener into a proper `useEffect` with cleanup, rather than attaching it in a ref callback.

---

## 4. Comment Input iOS Zoom Prevention

**Finding**: The comment input in `CommentsSection.tsx` (line 60) uses `text-xs sm:text-sm` which is 12px/14px -- both below 16px. This triggers iOS Safari auto-zoom when a user taps to type a comment.

**File**: `src/components/social/CommentsSection.tsx`
**Change**: Update to `text-base sm:text-sm` to match the pattern applied to `input.tsx`, `textarea.tsx`, and `select.tsx`.

---

## 5. Shop Search Input iOS Zoom Prevention

**Finding**: The search input in `ShopPage.tsx` (line 379) uses `text-sm` (14px) which triggers iOS auto-zoom.

**File**: `src/pages/ShopPage.tsx`
**Change**: Update to `text-base md:text-sm`.

---

## 6. Dead Code / Unused State

**Finding**: In `ShopPage.tsx` (line 177), `const [category] = useState('All')` is declared but never used in any filter logic (the filtering uses `productType` instead). This is leftover from a previous refactor.

**File**: `src/pages/ShopPage.tsx`
**Change**: Remove the unused `category` state declaration.

---

## Already Verified (No Changes Needed)

| Check | Status | Details |
|-------|--------|---------|
| Lazy loading (React.lazy) | PASS | All 50+ routes lazy-loaded in App.tsx |
| Suspense fallback | PASS | Slim progress bar PageLoader with min-h |
| TanStack Query caching | PASS | staleTime: 2min, gcTime: 10min globally |
| Image lazy loading | PASS | OptimizedImage and LazyMedia use loading="lazy" by default |
| Image alt props | PASS | All user-facing images have alt text |
| Global Error Boundary | PASS | ErrorBoundary wraps all routes in App.tsx |
| Sonner toast feedback | PASS | All mutations (save, delete, like, comment, order) trigger toasts |
| 44px touch targets | PASS | Global CSS rule + individual component enforcement |
| iOS zoom (input/textarea/select) | PASS | text-base on mobile (except comment input, shop search -- see above) |
| Admin mobile sidebar | PASS | Sheet drawer, auto-closes on link click |
| Feed virtualization | PASS | content-visibility: auto on PostCard wrappers |
| Cart persistence | PASS | localStorage in CartContext |
| Horizontal overflow | PASS | No body overflow-x issues found; tables use card views |
| Feed skeletons | PASS | FeedSkeletons and PostCardSkeleton used correctly |

---

## Files to Modify (Summary)

| File | Change | Risk |
|------|--------|------|
| `src/pages/AuthPage.tsx` | Remove production console.log (line 225) | None |
| `src/components/social/LazyMedia.tsx` | Fix timeupdate listener memory leak in LazyVideo | Low |
| `src/components/social/CommentsSection.tsx` | Comment input: `text-xs sm:text-sm` to `text-base sm:text-sm` | None |
| `src/pages/ShopPage.tsx` | Search input: `text-sm` to `text-base md:text-sm`; remove unused `category` state | None |

Total: 4 files, 5 targeted changes. No new dependencies. No structural refactors needed.

