

# Admin Panel Optimization and Bug Fixes

## Issues Found

### 1. Dashboard Stats Include Trashed Orders (Bug)
The `useAdminStats` hook in `src/hooks/useAdmin.ts` counts ALL orders including trashed ones for `totalOrders`, `pendingOrders`, `cancelledOrders`, and revenue calculations. This means the dashboard shows inflated numbers.

**Fix**: Add `.is('trashed_at', null)` filter to all order queries in `useAdminStats`.

### 2. Slow Page Transitions Between Admin Pages
Admin routes are lazy-loaded but there's no prefetching when hovering sidebar/mobile nav links. This causes a loading flash when navigating.

**Fix**: Add route prefetching to `AdminSidebar.tsx` and `AdminMobileNav.tsx` using `onMouseEnter`/`onTouchStart` handlers that trigger dynamic imports for the target page chunks.

### 3. Realtime: delivery_zones Table Not Subscribed
The `useAdminRealtimeDashboard` hook doesn't subscribe to `delivery_zones` table changes. If another admin updates zones, the current admin won't see changes.

**Fix**: Add `delivery_zones` subscription to the centralized realtime hook.

### 4. Dashboard Stats Query Not Excluding Trashed from Revenue
The revenue calculation fetches `total_amount, status` from orders but doesn't filter out trashed orders, leading to inaccurate revenue display.

**Fix**: Add trashed_at filter to the revenue query as well.

### 5. AdminOrders: Trashed Count Not Refreshing in Stats
When trashing/restoring on the Orders page, the `admin-stats` query isn't invalidated, so the dashboard stat cards show stale data.

**Fix**: Add `admin-stats` invalidation to trash/restore/delete operations in `AdminOrders.tsx`.

## Technical Details

### File 1: `src/hooks/useAdmin.ts`
- Add `.is('trashed_at', null)` to these queries inside `useAdminStats`:
  - `totalOrders` count query
  - `pendingOrdersCount` query
  - `cancelledOrdersCount` query
  - `recentOrders` data query
  - `revenueRows` data query

### File 2: `src/hooks/useAdminRealtimeDashboard.ts`
- Add `delivery_zones` table subscription
- Add `clinic_reviews` table subscription for rating updates
- Add query invalidation for `admin-delivery-zones`

### File 3: `src/components/admin/AdminSidebar.tsx`
- Add `onMouseEnter` prefetch handlers on nav `Link` elements
- Map each admin path to its lazy import for chunk preloading

### File 4: `src/components/admin/AdminMobileNav.tsx`
- Add `onTouchStart` prefetch handlers on mobile nav links
- Same prefetch mapping as sidebar

### File 5: `src/pages/admin/AdminOrders.tsx`
- Add `admin-stats` invalidation in `trashOrder`, `restoreOrder`, and `permanentlyDeleteOrder` functions
- Add `admin-pending-counts` invalidation too

### File 6: `src/hooks/useIncompleteOrders.ts`
- Add `admin-stats` invalidation in trash/restore/delete mutation `onSuccess` callbacks

## Files to Edit (6 files)
1. `src/hooks/useAdmin.ts` - Filter trashed orders from stats
2. `src/hooks/useAdminRealtimeDashboard.ts` - Add missing table subscriptions
3. `src/components/admin/AdminSidebar.tsx` - Add prefetching for faster navigation
4. `src/components/admin/AdminMobileNav.tsx` - Add prefetching for mobile
5. `src/pages/admin/AdminOrders.tsx` - Invalidate stats on trash actions
6. `src/hooks/useIncompleteOrders.ts` - Invalidate stats on trash actions

