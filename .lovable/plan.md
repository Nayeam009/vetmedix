
# Infinite Scroll Product Feed — Vetmedix Shop Upgrade

## What This Solves

The current shop loads **all products at once** (one large network payload) and uses a manual "Load More" button. This plan replaces that with **true infinite scroll**: products are fetched in pages of 20 as the user scrolls, using React Query's `useInfiniteQuery` with the existing Supabase `.range()` API. The result is a faster initial load, seamless auto-loading, and premium skeleton loading states — all while preserving every existing feature (hero, featured section, filters, sort, grid toggle, recently viewed, realtime).

---

## Architecture

The key change is the data-fetching layer in `ShopPage.tsx`. Everything else (UI, filters, ProductCard) stays intact.

```text
BEFORE:
  useQuery(['public-products'])
    → SELECT * FROM products (ALL rows at once)
    → Client-side slice with visibleCount
    → Manual "Load More" button

AFTER:
  useInfiniteQuery(['shop-products', { search, category, price, sort }])
    → SELECT ... RANGE(page*20, page*20+19) (20 rows per page, server-side)
    → IntersectionObserver sentinel at bottom of grid
    → Auto-triggers fetchNextPage() when sentinel enters viewport
    → Skeleton grid shown while next page loads
```

---

## Technical Implementation Details

### 1. `useInfiniteQuery` Migration (core change)

Replace the current `useQuery` in `ShopPage.tsx` with `useInfiniteQuery`. The query function receives `pageParam` (starts at `0`) and uses Supabase's `.range(start, end)`:

```ts
useInfiniteQuery({
  queryKey: ['shop-products', { search, category, price, sort }],
  queryFn: async ({ pageParam = 0 }) => {
    const from = pageParam * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    // Build query with all filters applied server-side
    let query = supabase
      .from('products')
      .select('id, name, price, ...')
      .eq('is_active', true)
      .range(from, to);
    // Apply sort, category, price filters...
    return data;
  },
  getNextPageParam: (lastPage, pages) =>
    lastPage.length === PAGE_SIZE ? pages.length : undefined,
  initialPageParam: 0,
});
```

**Key benefit:** Filters (`search`, `category`, `price`, `sort`) are now part of the `queryKey`. When the user changes a filter, React Query automatically discards the old pages and starts a fresh paginated fetch — no manual reset of `visibleCount` needed.

### 2. Server-Side Filtering

All filtering that was previously done client-side moves to the Supabase query:
- **Search:** `.ilike('name', '%query%')`
- **Category:** `.eq('category', value)`
- **Price range:** `.gte('price', min).lte('price', max)`
- **Sort:** `.order(column, { ascending })` — mapped from the sort dropdown values

### 3. IntersectionObserver Sentinel (using existing hook)

The existing `useInfiniteScroll` hook in `src/hooks/useInfiniteScroll.ts` is already built for this exact purpose. It will be wired to `fetchNextPage`:

```tsx
const { sentinelRef } = useInfiniteScroll(
  fetchNextPage,
  { isLoading: isFetchingNextPage, hasMore: !!hasNextPage }
);

// Placed at the bottom of the product grid:
<div ref={sentinelRef} className="h-1" aria-hidden="true" />
```

### 4. Loading State: Skeleton Grid (not spinner)

Two loading states:
- **Initial load:** Full skeleton grid of 12 cards (existing shimmer style, already in the codebase).
- **Next page loading:** A smaller skeleton row of 6 cards appended **below** the current products while the next page fetches. This creates the "content is appearing" feel.

### 5. Ratings Adaptation

`useProductRatings` currently takes a flat array of IDs. With infinite query, products come back in pages. The IDs will be collected from all loaded pages (`data.pages.flatMap(p => p.map(p => p.id))`) and passed to the existing hook — no changes needed to `useProductRatings`.

### 6. Realtime Subscription

The realtime channel is preserved, but instead of `invalidateQueries`, it will call `refetch()` on the infinite query to reset from page 0 when a product change occurs in the database.

### 7. Featured Products Section

The featured products section currently uses the full `products` array. Since infinite query no longer fetches everything at once, a **separate small `useQuery`** will be added to fetch only `is_featured = true` products (already exists as `['featured-products']` cache key from `FeaturedProducts.tsx`). This is already done correctly in the existing code — it just needs to be decoupled from the main paginated query.

---

## Files to Modify

| File | Change |
|---|---|
| `src/pages/ShopPage.tsx` | Replace `useQuery` → `useInfiniteQuery`; move filters server-side; add sentinel; replace Load More button with auto-scroll; add next-page skeleton |
| `src/hooks/useInfiniteScroll.ts` | Minor: expose `isFetchingNextPage` guard fix (already compatible, no change needed) |

**No new files needed.** No database changes. No new dependencies.

---

## What Is Preserved

- Hero banner with sliding background images
- Featured products horizontal scroll (via a separate small query)
- Category filter chips (desktop + mobile sheet)
- Price range filter
- Sort dropdown (newest, price, discount, top-rated)
- Grid view toggle (3/4/6 columns)
- Active filter badges with X to remove
- "No results" state with popular products fallback
- Recently Viewed section
- Realtime product updates
- Cart/wishlist buttons in the search bar
- All SEO and accessibility attributes

---

## UX Flow

```text
User opens /shop
  → Initial skeleton grid (12 cards, instant feel)
  → Page 1 loads (20 products appear with fade-in)
  → User scrolls
  → Sentinel enters viewport 200px before bottom
  → 6-card skeleton row appended instantly
  → Page 2 fetches silently
  → Page 2 products replace skeletons
  → Repeat until no more products
  → "All X products loaded" end-of-list message
```

---

## Filter Change Behavior

When user changes any filter:
- `queryKey` changes → React Query clears pages → fetches page 0 fresh
- Scroll position is not reset (browser handles naturally since new content replaces old)
- Debounce applied to search input (300ms) to prevent rapid re-fetches while typing

---

## Mobile Behavior

On mobile the grid remains `grid-cols-3` (compact). The sentinel fires when scrolling near the bottom of the page. Touch scrolling momentum continues uninterrupted since IntersectionObserver is passive and does not block the scroll thread.
