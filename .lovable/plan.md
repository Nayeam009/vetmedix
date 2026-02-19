
# Upgrade Shop to True Infinite Scroll

## What Exists vs. What Changes

The shop is already well-built. This upgrade is purely a **data-fetching architecture swap** — no UI redesign, no new components, no database changes.

### Current State (Problem)
- `useQuery` fetches **all** products in one request (`SELECT *` with no range)
- Client-side `slice(0, visibleCount)` simulates pagination
- "Load More" button manually increments `visibleCount`
- Filtering and sorting happen entirely in-memory on the full dataset

### Target State
- `useInfiniteQuery` fetches products in **pages of 20** using Supabase `.range()`
- Server-side range queries with filters passed as query parameters
- Intersection Observer sentinel replaces the "Load More" button
- Skeleton loaders distinguish "initial load" from "fetching next page"

---

## Architecture: Server-Side Filtering + Infinite Pages

The key insight: because filtering happens server-side now, every filter/sort change must **reset the page** back to 0. `useInfiniteQuery` handles this automatically when its `queryKey` changes.

```text
User changes filter
  → queryKey changes (includes filter state)
  → useInfiniteQuery resets and fetches page 0
  → Sentinel visible → fetchNextPage (page 1, 2, ...)
  → hasNextPage = false when returned count < PAGE_SIZE
  → "You've viewed all products" message appears
```

---

## Files to Modify

### 1. `src/pages/ShopPage.tsx` — Core Change

**Replace `useQuery` with `useInfiniteQuery`:**

```typescript
// NEW fetch function (inside queryFn)
const fetchProducts = async ({ pageParam = 0 }) => {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('products')
    .select('id, name, price, category, product_type, description, image_url, images, stock, badge, discount, created_at, is_featured, is_active, compare_price, sku')
    .eq('is_active', true)
    .range(from, to);

  // Apply search filter server-side
  if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
  
  // Apply category filter server-side  
  if (productType !== 'All') query = query.eq('category', productType);

  // Apply price filter server-side
  if (priceRange === 'under500') query = query.lt('price', 500);
  if (priceRange === '500to1000') query = query.gte('price', 500).lte('price', 1000);
  if (priceRange === 'over1000') query = query.gt('price', 1000);

  // Apply sort server-side
  if (sortBy === 'price-low') query = query.order('price', { ascending: true });
  else if (sortBy === 'price-high') query = query.order('price', { ascending: false });
  else if (sortBy === 'discount') query = query.order('discount', { ascending: false, nullsFirst: false });
  else query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
};

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
} = useInfiniteQuery({
  queryKey: ['shop-products', searchQuery, productType, priceRange, sortBy],
  queryFn: fetchProducts,
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages) =>
    lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  staleTime: 2 * 60 * 1000,
});

// Flatten all pages into single array
const products = data?.pages.flat() ?? [];
```

**Replace "Load More" button with sentinel:**

The existing `useInfiniteScroll` hook at `src/hooks/useInfiniteScroll.ts` is already built and ready. Wire it up:

```typescript
const { sentinelRef } = useInfiniteScroll(
  () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); },
  { hasMore: !!hasNextPage, isLoading: isFetchingNextPage }
);
```

**Distinguish initial load vs. next-page load:**
- `isLoading` (TanStack Query) = true only on initial fetch → show full 8-skeleton grid
- `isFetchingNextPage` = true only when fetching pages 2+ → show 4 skeleton cards **appended below** existing products (scroll position preserved)

**End-of-catalog message:**
Replace the current "Showing all X products" text with:
```tsx
{!hasNextPage && products.length > PAGE_SIZE && (
  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
    <Package className="h-6 w-6" />
    <p className="text-sm">You've viewed all products</p>
  </div>
)}
```

### 2. Filter Reset Behavior

When any filter changes, `queryKey` changes → React Query automatically cancels and restarts from page 0. No `setVisibleCount(PRODUCTS_PER_PAGE)` calls needed anywhere. Remove all `setVisibleCount` calls and the `visibleCount` state entirely.

### 3. Rating Fetch Adjustment

`useProductRatings` currently takes all product IDs at once. With infinite scroll, IDs grow incrementally. Change the call to use the flattened products array:

```typescript
const productIds = useMemo(() => products.map(p => p.id), [products]);
const ratings = useProductRatings(productIds);
```

This already works correctly — `useProductRatings` fetches ratings for whatever IDs are passed. As more pages load, the IDs array grows and ratings are fetched for new products.

### 4. Featured Products Section

The hero carousel and "Featured Products" horizontal scroll strip use a **separate** dedicated query for `is_featured = true` products. This remains unchanged — it's a different `queryKey` (`['featured-products']`) and doesn't interfere with the infinite scroll query.

---

## Loading State Strategy

| State | What renders |
|---|---|
| `isLoading === true` (initial) | 8 skeleton cards in full grid, no products |
| `isFetchingNextPage === true` | All loaded products + 4 skeleton cards appended at bottom |
| `!hasNextPage && products.length > 0` | All products + "You've viewed all products" footer |
| `products.length === 0 && !isLoading` | Empty state with "No products found" |

The skeleton shape matches `ProductCard`: square image area + 3 text lines + button. Uses existing Tailwind `animate-pulse` classes (already in the codebase) — no new dependencies.

---

## Realtime Subscription Adjustment

The existing realtime channel invalidates `['public-products']`. Update it to invalidate `['shop-products']` to match the new query key.

---

## Technical Details

- **No new packages** — `useInfiniteQuery` is already in `@tanstack/react-query`, `useInfiniteScroll` hook already exists
- **No database changes** — `products` table and RLS are already correct
- **No `react-intersection-observer` install needed** — the existing `useInfiniteScroll` hook uses native `IntersectionObserver` API
- **`top-rated` sort** — cannot be done server-side (ratings are in `reviews` table). When `sortBy === 'top-rated'`, fall back to client-side sort on the loaded page. A note will be added in the UI that top-rated shows within loaded products.
- **Page size**: Keep `PAGE_SIZE = 20` (matches existing `PRODUCTS_PER_PAGE` constant)
- **`discount` sort**: `price` column holds original price. The `discount` field is the percentage. Server-side sort by `discount DESC` works correctly.

---

## Summary of Changes

| File | Change Type | Risk |
|---|---|---|
| `src/pages/ShopPage.tsx` | Refactor data layer | Low — UI unchanged |

**One file, one architectural swap. All existing UI, filters, carousel, and recently viewed sections remain identical.**
