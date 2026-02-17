

# Gap Analysis Report: Cross-Role Integrity Test

## 1. SYNC ISSUES

### SYNC-1: Admin Appointments Realtime -- PASS
The `useAdminRealtimeDashboard` hook (line 106) subscribes to all events on the `appointments` table and invalidates `admin-appointments` + `admin-stats`. New bookings appear instantly in the Admin panel without refresh.

### SYNC-2: Admin Orders Realtime -- PASS
The hook (line 27) listens for `INSERT` on `orders` with a toast notification ("New order received!") and invalidates `admin-orders` + `admin-stats`. Orders appear instantly.

### SYNC-3: Pet Parent Order Status Updates -- PASS
`ProfilePage.tsx` (line 172) subscribes to `UPDATE` on `orders` filtered by `user_id`. Admin status changes ("Shipped", "Confirmed") reflect in real-time on the customer's "My Orders" view via direct cache mutation.

### SYNC-4: Pet Parent Appointment Status Updates -- PASS
`ProfilePage.tsx` (line 190) subscribes to all events on `appointments` filtered by `user_id`, invalidating the cache on any change. Admin confirmations appear instantly.

### SYNC-5: Inventory Decrement -- PASS
The `create_order_with_stock` RPC atomically locks rows, checks stock, inserts the order, and decrements inventory in a single transaction. Admin sees updated stock via realtime product subscription (line 66).

### SYNC-6: Cart Clear After Purchase -- PASS
`CheckoutPage.tsx` (line 292) calls `clearCart()` immediately after successful order placement.

---

## 2. MOBILE FAILURES

### MOB-1: No Sticky "Book Now" Button on ClinicDetailPage (Medium)
**File**: `src/pages/ClinicDetailPage.tsx`

The "Book Appointment" button exists only inside the hero card overlay (line 373-380). On mobile, once the user scrolls past the hero into the tabs (About, Services, Doctors, Reviews), the booking CTA scrolls out of view. There is no sticky/fixed bottom CTA bar for mobile users.

Compare with `CheckoutPage` and `CartPage` which both implement a `fixed bottom-14` action bar on mobile. The clinic page lacks this pattern.

**Fix**: Add a fixed bottom bar (visible only on mobile, hidden on `md:`) with a "Book Appointment" button, positioned at `bottom-14` to sit above `MobileNav`. This matches the existing checkout/cart pattern.

### MOB-2: Admin "Recent Orders" on Mobile -- PASS
Already uses a responsive card layout with `md:hidden` card view and `hidden md:block` table view. Touch targets are 44px minimum.

### MOB-3: ProductCard Touch Targets -- PASS
Global CSS enforces 44px minimum interactive element sizing. The "Add to Cart" button meets the threshold.

---

## 3. PERFORMANCE

### PERF-1: Console Ref Warning Still Firing (Low)
**File**: `src/components/social/PostCard.tsx`

The warning `"Function components cannot be given refs"` persists in the console. The previous fix wrapped the `DropdownMenu` in a `<div>` (line 131), but the warning originates from a different source: `PostCardComponent` itself is wrapped in `memo()` without `forwardRef`. When rendered inside `TabsContent` (in `BelowFoldContent.tsx`), Radix passes a ref down to the child component. Since `PostCardComponent` is a plain function component (not wrapped in `forwardRef`), React warns.

The outer `<div>` wrapper (line 104) should absorb this ref, but the warning stack trace shows the ref is targeting the `DropdownMenu` component specifically -- Radix's `DropdownMenu` root is itself a function component that doesn't accept refs, and Radix internally tries to set one.

**Fix**: Convert the `PostCard` export to use `React.forwardRef` so the ref chain is properly handled. The forwarded ref can be applied to the outer `<div>` wrapper, preventing it from propagating further into the component tree.

### PERF-2: Booking Feedback -- PASS
`BookAppointmentPage` shows a toast ("Appointment Booked!") immediately after the RPC resolves (line 122-125), then navigates to `/profile`.

### PERF-3: Add-to-Cart Feedback -- PASS (Fixed in previous audit)
`ProductCard` now shows `toast.success(name + ' added to cart!')` immediately after `addItem()`.

---

## 4. SECURITY

### SEC-1: Admin Route Guard -- PASS
`RequireAdmin` checks `useAdmin()` which queries the `user_roles` table server-side. Pet Parents are redirected to `/`.

### SEC-2: RLS on Orders -- PASS
`Users can view their own orders` policy uses `auth.uid() = user_id`. Admins have a separate `Admins can view all orders` policy.

### SEC-3: Appointment Booking Auth -- PASS
`book_appointment_atomic` RPC verifies `auth.uid() = p_user_id` and the unique partial index prevents double-booking.

---

## Summary Table

| ID | Category | Severity | File | Description |
|----|----------|----------|------|-------------|
| MOB-1 | Mobile UX | Medium | ClinicDetailPage.tsx | No sticky "Book Now" button on mobile -- CTA scrolls out of view |
| PERF-1 | Performance | Low | PostCard.tsx | Console ref warning persists -- needs forwardRef on memo export |

## Proposed Fixes (2 items)

### Fix 1: Sticky Mobile "Book Now" Bar on ClinicDetailPage
Add a fixed bottom bar to `ClinicDetailPage.tsx`, visible only below `md` breakpoint, positioned at `bottom-14` (above MobileNav). Contains a full-width "Book Appointment" button with `min-h-[44px]`. This matches the existing sticky bar pattern used in CartPage and CheckoutPage.

### Fix 2: forwardRef on PostCard to Silence Ref Warning
Wrap the `PostCardComponent` export with `React.forwardRef`, applying the forwarded ref to the outer `<div>` wrapper. Update the `memo()` call to wrap the `forwardRef` result. This properly handles refs passed from `TabsContent` and eliminates the console warning.

Total: 2 files modified. No database changes. No new dependencies.
