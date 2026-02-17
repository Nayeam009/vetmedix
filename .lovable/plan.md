

# Phase 3: "App-Like" Polish -- Performance and UX

This phase converts Vetmedix from a "website" feel into a smooth, native-like web app experience. Most of the heavy lifting is already done -- this plan targets the remaining gaps.

---

## What's Already Working (No Changes Needed)

These items from the request are already implemented correctly:

- **Route transitions**: CSS-only `animate-page-enter` (fade + slide-up, 250ms) via `PageTransition` wrapper in `App.tsx` -- lightweight, no Framer Motion needed.
- **Lazy loading**: All 50+ routes use `React.lazy()` with a shared `Suspense` fallback (slim progress bar).
- **Feed skeletons**: `FeedSkeletons` and `PostCardSkeleton` are used in `FeedPage.tsx` for loading states.
- **Admin mobile sidebar**: `AdminHeader` already renders a `Sheet` with `AdminMobileNav` on mobile, auto-closing on link click.
- **Main mobile nav**: Bottom tab bar (`MobileNav`) + hamburger `Sheet` sidebar in `Navbar`, both with `min-h-[44px]` touch targets and `active:scale-[0.98]` feedback.
- **Input iOS zoom prevention**: `input.tsx` already uses `text-base` (16px) on mobile, preventing Safari auto-zoom.
- **Image lazy loading**: `OptimizedImage` and `LazyMedia` components use `loading="lazy"` by default; hero images use `loading="eager"`.

---

## Changes Required

### 1. Fix iOS Auto-Zoom on Textarea and Select (Accessibility)

**Problem**: `textarea.tsx` and `select.tsx` use `text-sm` (14px) on all screen sizes. On iOS Safari, any input with font-size below 16px triggers an automatic zoom that disorients users.

**Files**: `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`

**Change**: Apply the same pattern as `input.tsx` -- use `text-base md:text-sm` so mobile gets 16px and desktop gets 14px.

### 2. Increase Base Touch Target from 32px to 44px (Mobile UX)

**Problem**: The global CSS rule in `index.css` sets `min-height: 32px` for buttons, links, and interactive elements. The WCAG recommended minimum is 44px on touch devices.

**File**: `src/index.css` (line 182)

**Change**: Update the base rule to use `min-height: 44px` on mobile only via a media query, keeping 32px on desktop where mouse precision is higher.

### 3. Add Skeleton Loaders to ShopPage Product Grid

**Problem**: The ShopPage shows a skeleton grid during loading, but the product grid container has no reserved height during the initial empty state, causing a brief layout shift.

**File**: `src/pages/ShopPage.tsx`

**Change**: The `min-h-[400px]` was already added in the previous phase. Verify the skeleton cards have explicit `aspect-ratio` to match final card dimensions and prevent CLS. If needed, add `aspect-square` to skeleton items.

### 4. Enhance Page Transition Smoothness

**Problem**: The current `animate-page-enter` uses a simple fade+slide. On faster navigations, there's a brief flash because `ScrollToTop` resets scroll position before the animation starts.

**File**: `src/App.tsx`

**Change**: Wrap the scroll-to-top call in a `requestAnimationFrame` to sync with the paint cycle, eliminating the visual flash during fast route transitions.

### 5. Add Haptic-Style Feedback to Bottom Navigation

**Problem**: The bottom `MobileNav` icons lack visual pressed state beyond `active:scale-95`.

**File**: `src/components/MobileNav.tsx`

**Change**: Add a subtle background highlight on press (`active:bg-primary/10`) for tactile feedback, matching the Sheet sidebar pattern.

---

## Technical Details

| File | Change | Risk |
|------|--------|------|
| `src/components/ui/textarea.tsx` | `text-sm` to `text-base md:text-sm` | None -- matches input.tsx pattern |
| `src/components/ui/select.tsx` | `text-sm` to `text-base md:text-sm` (SelectTrigger only) | None -- matches input.tsx pattern |
| `src/index.css` (line 182) | Media query for 44px touch targets on mobile | Low -- only affects mobile |
| `src/App.tsx` (ScrollToTop) | Wrap `scrollTo` in `requestAnimationFrame` | None |
| `src/components/MobileNav.tsx` | Add `active:bg-primary/10` to nav items | None -- additive CSS |

### No New Dependencies

All changes use existing CSS, browser APIs, and Tailwind utilities. No Framer Motion or other animation libraries needed -- the existing CSS-only approach is lighter and already performant.

