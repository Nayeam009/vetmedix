

# Media Optimization and Page Transition Speed - All Pages

## Goal
Reduce media loading times, eliminate layout shifts, and make page-to-page navigation feel instant -- all without losing image quality.

---

## Part 1: Global Optimized Image Component

**Create `src/components/ui/OptimizedImage.tsx`** -- a single reusable component to replace raw `<img>` tags across all 50+ pages.

Features:
- Intersection Observer lazy loading (like existing `LazyImage` but lighter)
- Skeleton placeholder with smooth fade-in (prevents CLS)
- Built-in `width`, `height`, `decoding="async"`, `loading` attributes
- `fetchPriority="high"` option for above-the-fold hero images
- Supabase storage URL transform support (appends `?width=X&height=Y` for server-side resizing when image is from storage)
- `sizes` attribute for responsive srcset-like behavior
- Error fallback state
- CSS `object-fit` defaults

This replaces scattered `<img>` tags with inconsistent attributes across ~21 files.

---

## Part 2: Supabase Storage Image Transform URLs

For images served from the backend storage, append query parameters to request appropriately sized images from the server, avoiding downloading full-resolution files:

- Thumbnails (cards, lists): `?width=300&quality=75`
- Medium (detail pages): `?width=800&quality=80`
- Full (hero, cover): `?width=1600&quality=85`

A utility function `getOptimizedUrl(url, preset)` will handle this automatically.

---

## Part 3: Route Prefetching for Instant Transitions

**Enhance `src/App.tsx`** with route-level prefetching:

- On hover/touch of navigation links, trigger `import()` for the target route's chunk
- Add a `usePrefetch` hook that components like `Navbar`, `MobileNav`, `ProductCard`, `ClinicCard`, `DoctorCard` use to warm up the next page
- This eliminates the "Loading..." spinner when navigating between pages

Example: hovering "Shop" in the navbar starts loading `ShopPage` chunk before the user clicks.

---

## Part 4: Page Transition Optimization

**Update `src/App.tsx` PageLoader and Suspense:**

- Replace the full-screen spinner with a slim top progress bar (like YouTube/GitHub)
- Add `startTransition` wrapping for non-urgent navigations
- Keep existing `staleTime: 2min` and `gcTime: 10min` on React Query (already good)

---

## Part 5: Component-Level Image Fixes (18+ files)

Replace raw `<img>` with `OptimizedImage` in these components:

| Component | Change |
|-----------|--------|
| `ProductCard.tsx` | Use OptimizedImage with product preset (300px) |
| `ClinicCard.tsx` | Use OptimizedImage with clinic preset (176px) |
| `DoctorCard.tsx` | Add `decoding="async"` to Avatar images |
| `ExplorePetCard.tsx` | Add `decoding="async"`, width/height to cover photos |
| `FeaturedProducts.tsx` | Products already use ProductCard -- no change needed |
| `PostCard.tsx` | Already uses LazyImage/LazyVideo -- enhance with storage transforms |
| `PetProfileCard.tsx` | Add OptimizedImage for cover/avatar uploads |
| `StoriesBar.tsx` | Avatar images get `decoding="async"` |
| `StoryViewer.tsx` | Already has lazy attrs -- add storage transforms |
| `OrderCard.tsx` | Use OptimizedImage for product thumbnails |
| `AdminProducts.tsx` | Use OptimizedImage for product list images |
| `AdminOrders.tsx` | Use OptimizedImage for order item images |
| `AdminSocial.tsx` | Use OptimizedImage for post media |
| `LowStockAlert.tsx` | Already optimized -- add storage transform |
| `ClinicHeader.tsx` | Already has eager + decoding -- add storage transform |
| `ClinicDetailPage.tsx` | Cover image gets responsive sizes |
| `ProductDetailPage.tsx` | Main image gets medium preset, thumbnails get small |
| `ProfileHeader.tsx` | Avatar gets storage transform |

---

## Part 6: CSS Performance Enhancements

**Update `src/index.css`:**

- Add `contain: layout style paint` to card components for rendering isolation
- Enhance existing `content-visibility: auto` with `contain-intrinsic-size` to prevent layout jumps
- Add GPU-accelerated transitions for image fade-ins using `will-change: opacity` only during animation

---

## Part 7: Avatar Optimization

The app uses Radix `AvatarImage` extensively. Add a global wrapper or utility that:
- Appends storage transform params to avatar URLs
- Sets `loading="lazy"` and `decoding="async"` by default
- Provides a consistent 400px max for avatar images (matching the existing `avatar` compression preset)

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `src/components/ui/OptimizedImage.tsx` | Universal optimized image component |
| `src/lib/imageUtils.ts` | Storage URL transform utility (`getOptimizedUrl`) |

## Files Modified

Approximately 20-25 files will have `<img>` tags replaced with `OptimizedImage` or enhanced with storage transforms and proper attributes.

## Expected Impact

- 40-60% reduction in image transfer size via server-side transforms
- Near-instant page transitions via route prefetching
- Zero layout shift via fixed dimensions and skeleton placeholders
- No quality loss -- server delivers optimally sized images, not client-side compression of already-loaded full images

