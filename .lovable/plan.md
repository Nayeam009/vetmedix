

# Performance Optimization Plan: Lighthouse 90+ and App-Like Transitions

## Current State Analysis

The app already has solid foundations: most routes are lazy-loaded, vendor chunks are split (`manualChunks`), hero images use `fetchPriority="high"`, and `loading="lazy"` is used broadly. The main bottlenecks are:

- **5 page modules statically imported** in `App.tsx` (Index, AuthPage, ShopPage, ClinicsPage, DoctorsPage) -- these all end up in the initial bundle
- **Index.tsx is 606 lines** and imports heavy social components (StoriesBar, PostCard, CreatePostCard, CommentsSection) that render below the fold
- **No page transition animations** -- route changes cause abrupt jumps
- **`recharts` in manualChunks** forces the entire charting library into a named chunk loaded early, even though only 2 files use it
- **Hero image (`hero-cat-social.png`)** is a static import that gets inlined/bundled rather than served as a separate asset with proper preload

---

## Phase 1: Critical Bundle Reduction (Biggest Lighthouse Impact)

### 1.1 Lazy-load ALL page routes in `App.tsx`
**File:** `src/App.tsx`
- Convert the 5 static imports (Index, AuthPage, ShopPage, ClinicsPage, DoctorsPage) to `React.lazy()` dynamic imports
- This removes those modules and all their transitive dependencies from the initial JS bundle
- **Impact:** Estimated 40-60% reduction in initial bundle. Index.tsx alone pulls in StoriesBar, PostCard, CreatePostCard, usePosts, PetContext queries, ScrollArea, and the entire social feed -- none of which are needed until that route renders

### 1.2 Split Index.tsx into above-fold and below-fold
**Files:** `src/pages/Index.tsx`, new `src/components/home/BelowFoldContent.tsx`
- The hero section (lines 124-354) is above the fold; everything after (stories, feed, sidebar, featured products) is below the fold
- Wrap below-fold content in a lazy-loaded component that only mounts after the hero is visible
- Use `React.lazy` + `Suspense` for the social feed section, or use Intersection Observer to defer rendering
- **Impact:** Hero renders immediately without waiting for social feed data queries

### 1.3 Remove `recharts` from manualChunks
**File:** `vite.config.ts`
- Remove `'vendor-charts': ['recharts']` from manualChunks
- Recharts is only imported in `AdminRecoveryAnalytics.tsx` and `chart.tsx` -- both are already in lazy-loaded routes
- Vite will naturally tree-shake it into those chunks only
- **Impact:** Removes ~200KB from the named chunk that gets loaded during initial discovery

---

## Phase 2: App-Like Page Transitions (UX)

### 2.1 CSS-only page transitions (no new dependencies)
**Files:** `src/App.tsx`, `src/index.css`
- Instead of adding `framer-motion` (45KB gzipped), use CSS animations with the existing `Suspense` boundary
- Create a `PageTransition` wrapper component that applies a CSS `fade-slide-up` animation on mount using `animation: fadeSlideUp 0.25s ease-out`
- Wrap `<Routes>` content in this component keyed by `location.pathname`
- **Impact:** Smooth transitions with zero bundle cost

### 2.2 Upgrade PageLoader to show progress
**File:** `src/App.tsx`
- The existing `PageLoader` already has a progress bar animation -- keep it but make the animation smoother (use `cubic-bezier` timing)
- Add `will-change: width` for GPU acceleration
- **Impact:** Users perceive faster loads because they see progress

---

## Phase 3: LCP and CLS Optimization

### 3.1 Preload hero image in index.html
**File:** `index.html`
- Add `<link rel="preload" as="image" href="/src/assets/hero-cat-social.png">` for the LCP element
- Currently the hero image is a JS static import which means it only starts loading after the JS bundle parses
- **Impact:** Reduces LCP by starting image fetch in parallel with JS parsing

### 3.2 Enforce width/height on all remaining images
**Files:** Multiple components (PostCard, ProductCard, ClinicCard, DoctorCard, ExplorePetCard)
- Audit and add explicit `width` and `height` attributes to any `<img>` tags missing them
- Use `aspect-ratio` Tailwind class (`aspect-square`, `aspect-video`) on containers as a fallback
- **Impact:** Eliminates CLS from image loading

### 3.3 Convert hero cat image to WebP
**Action:** Convert `hero-cat-social.png` to WebP format (typically 30-50% smaller)
- Use `<picture>` element with WebP source and PNG fallback
- **Impact:** Faster LCP paint

---

## Phase 4: Accessibility Quick Wins

### 4.1 Add missing `aria-label` to icon-only buttons
**Files:** `src/components/MobileNav.tsx`, `src/components/social/NotificationBell.tsx`, `src/components/GlobalSearch.tsx`
- Scan for `<Button size="icon">` patterns without `aria-label`
- The Navbar already has good coverage -- extend to other components
- **Impact:** Screen reader accessibility compliance

### 4.2 Verify color contrast
**File:** `src/index.css`
- The muted-foreground has already been darkened to 38% lightness (line 28) which helps
- Verify `--primary: 15 85% 60%` (coral) against white backgrounds meets WCAG AA (4.5:1 for text)
- If needed, darken to `--primary: 15 85% 50%` for text-only usage
- **Impact:** WCAG AA compliance

---

## Phase 5: Runtime Performance

### 5.1 Add `memo()` to heavy list-item components
**Files:** `src/components/ProductCard.tsx`, `src/components/social/PostCard.tsx`, `src/components/DoctorCard.tsx`, `src/components/ClinicCard.tsx`
- Wrap with `React.memo()` to prevent re-renders when parent state changes (e.g., filter toggles, search input)
- **Impact:** Fewer re-renders in grids of 20+ items

### 5.2 Defer non-critical context providers
**File:** `src/App.tsx`
- `CartProvider`, `WishlistProvider`, and `PetProvider` initialize Supabase queries on mount for ALL routes including admin
- Wrap them in a lazy boundary or move them inside only the routes that need them
- **Impact:** Reduces initial query count from 5+ to 2 (auth only)

---

## Priority and File Checklist

| Priority | Task | File(s) | Lighthouse Impact |
|----------|------|---------|-------------------|
| P0 | Lazy-load all 5 static page imports | `App.tsx` | -30% initial JS |
| P0 | Remove recharts from manualChunks | `vite.config.ts` | -200KB named chunk |
| P0 | Preload hero image | `index.html` | -500ms LCP |
| P1 | Split Index.tsx below-fold content | `Index.tsx`, new component | -20% route chunk |
| P1 | CSS page transitions | `App.tsx`, `index.css` | Perceived perf boost |
| P1 | Enforce width/height on images | 6+ component files | CLS score improvement |
| P2 | memo() on list components | 4 component files | Fewer re-renders |
| P2 | Defer context providers | `App.tsx` | -3 initial queries |
| P2 | Aria-labels audit | 3 component files | Accessibility score |
| P3 | WebP hero image | `Index.tsx`, asset file | -30% image size |
| P3 | Color contrast check | `index.css` | Accessibility score |

## How React.lazy Reduces the 6.2MB Bundle

Currently, `Index.tsx`, `ShopPage.tsx`, `ClinicsPage.tsx`, `DoctorsPage.tsx`, and `AuthPage.tsx` are statically imported. This means Vite includes them **and all their transitive dependencies** in the main entry chunk:

```text
App.tsx (entry)
  +-- Index.tsx (606 lines)
  |     +-- StoriesBar, PostCard, CreatePostCard (social feed)
  |     +-- usePosts, PetContext queries (data layer)
  |     +-- FeaturedProducts + ProductCard (shop)
  |     +-- ScrollArea, Tabs (UI primitives)
  +-- ShopPage.tsx
  |     +-- ProductCard, useProductCategories, useProductRatings
  +-- ClinicsPage.tsx
  |     +-- ClinicCard, useGeocode
  +-- DoctorsPage.tsx
  |     +-- DoctorCard, usePublicDoctors
  +-- AuthPage.tsx
        +-- Form validation, role selector
```

Converting these to `React.lazy()` moves each page and its dependencies into separate chunks that only load when the user navigates to that route. The initial bundle drops to just: React core, router, auth context, and the PageLoader skeleton -- estimated at under 300KB gzipped.

