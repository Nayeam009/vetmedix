

# Media Optimization Pipeline -- Gap Analysis and Implementation Plan

## Current State (Already Implemented)

Most of the requested architecture is already in place:

- **OptimizedImage component** (`src/components/ui/OptimizedImage.tsx`): Intersection Observer lazy loading, skeleton placeholder, fade-in, error fallback, Supabase URL transforms, `fetchPriority` support.
- **LazyImage / LazyVideo** (`src/components/social/LazyMedia.tsx`): Viewport-based lazy loading for social feed media with autoplay, muted default, progress bar.
- **Client-side compression** (`src/lib/mediaCompression.ts`): WebP conversion, presets for feed/story/avatar/product/clinic, thumbnail generation, video poster extraction.
- **All uploaders use compression**: `CreatePetPage`, `EditPetPage`, `ClinicProfile`, `PetProfileCard`, `ImageUpload`, `useStories`, `useMessages` -- all call `compressImage()` before upload.
- **Storage buckets**: Public (`pet-media`, `avatars`, `clinic-images`, `product-images`, `cms-media`) and private (`clinic-documents`, `doctor-documents`) are properly separated.

## Gaps Found (4 Items)

### GAP-1: No "Medical" Compression Preset (Medium)
**File:** `src/lib/mediaCompression.ts`

The `COMPRESSION_PRESETS` object has presets for feed, story, avatar, product, and clinic -- but no `medical` preset for doctor-uploaded medical images. Medical images (X-rays, lab results) require high fidelity with minimal lossy compression.

**Fix:** Add a `medical` preset: `{ maxWidth: 3000, maxHeight: 3000, quality: 0.95 }`. Update `validateAndOptimizeMedia` to accept `'medical'` as a context. Add a 10MB hard limit check specific to this preset.

---

### GAP-2: LazyVideo Auto-plays on Mobile -- No Facade Pattern (Medium)
**File:** `src/components/social/LazyMedia.tsx`

`LazyVideo` currently loads the full `<video>` element immediately and auto-plays when 50% visible, including on mobile. This wastes bandwidth on cellular connections. The Facade Pattern (show a static poster + play button, only mount `<video>` on click) would eliminate unnecessary video downloads.

**Fix:** Add a `facade` prop (default `true` on mobile via `useIsMobile()`). When facade is active, render only the poster image + a play button overlay. On click, swap in the actual `<video>` element. This avoids loading any video data until the user explicitly requests it.

**Lighthouse Impact:** Reduces main-thread work and network payload on initial load. Videos in feed won't contribute to LCP/TBT until interaction.

---

### GAP-3: `console.error` in mediaCompression.ts (Low)
**File:** `src/lib/mediaCompression.ts` (line 184)

The compression error handler uses bare `console.error` instead of the centralized `logger.error` utility. This was flagged in previous audits for other files but missed here.

**Fix:** Replace `console.error('Image compression failed, using original:', error)` with `logger.error('Image compression failed, using original:', error)`.

---

### GAP-4: OptimizedImage Missing Built-in Aspect Ratio Prop (Low)
**File:** `src/components/ui/OptimizedImage.tsx`

The component relies on the parent to set aspect ratio (e.g., `ProductCard` wraps it in `<AspectRatio ratio={1}>`). Adding an optional `aspectRatio` prop directly on `OptimizedImage` would simplify usage and reduce CLS risk when developers forget to wrap it.

**Fix:** Add an optional `aspectRatio` prop (e.g., `aspectRatio?: number`). When provided, apply `style={{ aspectRatio }}` to the container div alongside the existing `className`. This is additive and non-breaking.

---

## Summary Table

| ID | Category | Severity | File | Description |
|----|----------|----------|------|-------------|
| GAP-1 | Compression | Medium | mediaCompression.ts | No medical preset for high-fidelity doctor uploads |
| GAP-2 | Performance | Medium | LazyMedia.tsx | Video auto-plays on mobile; needs Facade Pattern |
| GAP-3 | Logging | Low | mediaCompression.ts | Bare `console.error` instead of `logger.error` |
| GAP-4 | CLS Prevention | Low | OptimizedImage.tsx | No built-in `aspectRatio` prop |

## Implementation Details

### Fix 1: Medical Compression Preset
- Add `medical: { maxWidth: 3000, maxHeight: 3000, quality: 0.95 }` to `COMPRESSION_PRESETS` in `mediaCompression.ts`
- Update `validateAndOptimizeMedia` type to accept `'medical'`
- Add a 10MB size gate: if file > 10MB and preset is medical, reject with error before compression

### Fix 2: Video Facade Pattern
- Add `facade?: boolean` prop to `LazyVideo`
- Default to `true` when `useIsMobile()` returns true (import from `@/hooks/use-mobile`)
- When facade is active: render poster image (or first-frame thumbnail) + centered play button overlay
- On click: set `facadeClicked = true`, mount the actual `<video>` element, call `.play()`
- When facade is inactive (desktop): keep current auto-play behavior unchanged

### Fix 3: Logger in mediaCompression
- Add `import { logger } from '@/lib/logger'` at top
- Replace line 184: `console.error(...)` with `logger.error(...)`

### Fix 4: AspectRatio Prop on OptimizedImage
- Add `aspectRatio?: number` to `OptimizedImageProps`
- In the container `<div>`, merge `style={{ aspectRatio, ...style }}`
- Non-breaking: when not provided, behavior is unchanged

**Total: 3 files modified (`mediaCompression.ts`, `LazyMedia.tsx`, `OptimizedImage.tsx`). No database changes. No new dependencies.**

