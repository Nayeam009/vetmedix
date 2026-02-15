

# Featured Products Admin Control & Shop Integration

## Overview
Connect the admin's `is_featured` toggle to the shop's hero carousel and add a "Featured Products" section to the shop page. Admin-set discounts on featured products will reflect in real-time across the shop.

---

## Changes

### 1. Shop Product Interface Update (`ShopPage.tsx`)
Add `is_featured`, `is_active`, `compare_price`, and `sku` to the local `Product` interface so the shop can filter by these fields.

### 2. Hero Carousel - Use `is_featured` (`ShopPage.tsx`)
Update the `HeroCarousel` component's `featured` logic:
- **Primary**: Show products where `is_featured === true` (admin-controlled)
- **Fallback**: If no featured products exist, fall back to discounted products (current behavior)
- Show `compare_price` as strikethrough when available (in addition to discount %)

### 3. Filter Active Products (`ShopPage.tsx`)
Add a filter to only show `is_active !== false` products in the public shop listing, so admin deactivation works.

### 4. Featured Products Section in Shop (`ShopPage.tsx`)
Add a dedicated "Featured Products" horizontal scroll section between the hero and the product grid:
- Only shows when there are featured products (`is_featured === true`)
- Displays as a scrollable row of ProductCards
- Mobile: horizontal scroll with snap points
- Desktop: up to 4 columns grid
- Shows discount badges and compare prices

### 5. Update `FeaturedProducts.tsx` Component
Rewrite to query only `is_featured = true` products with realtime subscription:
- Filter by `is_featured` and `is_active`
- Use React Query instead of raw `useState/useEffect`
- Subscribe to realtime changes on products table
- Show compare_price strikethrough and discount badges
- This component can be used on the homepage (Index page) if desired

### 6. Add FeaturedProducts to Index Page (`Index.tsx`)
Import and render `FeaturedProducts` component on the landing page between the social feed section and the footer, giving the homepage a shop preview.

### 7. Realtime Sync
Both the shop hero and featured sections already subscribe to product changes via realtime. The existing subscription invalidates React Query cache, so admin toggle changes (featured, active, discount) will reflect immediately.

---

## Technical Details

### Files to Edit
1. **`src/pages/ShopPage.tsx`**
   - Extend Product interface with `is_featured`, `is_active`, `compare_price`
   - Update HeroCarousel to prioritize `is_featured` products
   - Filter out inactive products from display
   - Add "Featured Products" section between hero and product grid

2. **`src/components/FeaturedProducts.tsx`**
   - Rewrite to use React Query with `is_featured = true` and `is_active = true` filters
   - Add realtime subscription
   - Show compare_price and discount info

3. **`src/pages/Index.tsx`**
   - Import and render FeaturedProducts before Footer

### No Database Changes Needed
The `is_featured` and `is_active` columns already exist. The admin toggle handlers already work. This is purely a frontend connection task.

### Key Logic
```text
Admin toggles "Featured" on a product
  -> Supabase updates is_featured = true
  -> Realtime event fires
  -> React Query cache invalidates
  -> Shop hero carousel updates to show featured products
  -> Featured Products section updates
  -> Homepage featured section updates
```

