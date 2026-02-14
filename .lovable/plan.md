

## Admin Panel: Realtime Updates, Clickable Cards, and Mobile Optimization

### Problem Summary
1. **Missing Realtime**: Only the Dashboard page subscribes to realtime events. Other admin pages (Analytics, Clinics, Doctors, Products, Customers, Social, Contact Messages, Coupons) do not auto-update when data changes.
2. **Missing Realtime Tables**: `clinics`, `doctors`, `products`, `profiles`, `posts`, `contact_messages` are NOT added to `supabase_realtime` publication. Only `orders`, `appointments`, `notifications`, `appointment_waitlist`, `doctor_join_requests`, `coupons` are enabled.
3. **Non-clickable cards**: Dashboard ECommerce and Platform Overview stat cards use `StatCard` with `href` (works), but some pages have cards that lack click handlers or navigation.
4. **Mobile UX gaps**: Some pages have minor responsive issues.

---

### Plan

#### Step 1: Enable Realtime on Missing Tables (Database Migration)

Add the following tables to the `supabase_realtime` publication so Postgres changes can be received by the frontend:
- `clinics`
- `doctors`
- `products`
- `profiles` (for customer updates)
- `posts` (for social moderation)
- `contact_messages`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
```

#### Step 2: Expand `useAdminRealtimeDashboard` Hook

Extend the existing hook to subscribe to ALL admin-relevant tables so every admin page benefits from a single, centralized subscription. Add listeners for:
- `products` (INSERT/UPDATE/DELETE) -- invalidates `admin-products`, `admin-stats`
- `clinics` (INSERT/UPDATE/DELETE) -- invalidates `admin-clinics`, `admin-clinic-stats`, `admin-stats`
- `doctors` (INSERT/UPDATE/DELETE) -- invalidates `admin-doctors`, `admin-stats`
- `orders` (UPDATE) -- also invalidate on status changes, not just new inserts
- `profiles` (INSERT/UPDATE) -- invalidates `admin-users`
- `posts` (INSERT/UPDATE/DELETE) -- invalidates `admin-posts`, `admin-stats`
- `contact_messages` (INSERT/UPDATE) -- invalidates `admin-contact-messages`
- `coupons` (INSERT/UPDATE/DELETE) -- invalidates `admin-coupons`
- `appointments` (INSERT/UPDATE) -- invalidates `admin-appointments`, `admin-stats`

Also invalidate `admin-analytics` and `admin-pending-counts` on any change.

#### Step 3: Use the Realtime Hook on All Admin Pages

Currently only `AdminDashboard` calls `useAdminRealtimeDashboard(isAdmin)`. Add this call to:
- `AdminAnalytics`
- `AdminOrders` (remove its duplicate local channel subscription)
- `AdminClinics`
- `AdminDoctors`
- `AdminProducts`
- `AdminCustomers`
- `AdminSocial`
- `AdminContactMessages`
- `AdminCoupons`
- `AdminSettings`

#### Step 4: Ensure All Stat Cards Are Clickable

Review and fix clickability across all admin pages:

| Page | Current State | Fix |
|------|--------------|-----|
| Dashboard ECommerce | Uses `StatCard` with `href` -- works | No change needed |
| Dashboard Platform Overview | Uses `StatCard` with `href` -- works | No change needed |
| Dashboard Quick Actions | Buttons with `onClick` -- works | No change needed |
| Analytics stat cards | Uses `AnalyticsStatCard` with `href` -- works | No change needed |
| Clinics stat cards | Uses `Card` with `onClick` -- works | No change needed |
| Doctors stat cards | Uses `Card` with `onClick` -- works | No change needed |
| Products stat bar | Uses `ProductStatsBar` -- verify clickability | Verify and fix if needed |
| Orders stat bar | Uses `OrderStatsBar` -- verify clickability | Verify and fix if needed |
| Customers stat cards | Wraps `StatCard` in div with `onClick` -- works | No change needed |

#### Step 5: Mobile Responsiveness Audit and Fixes

- Ensure all admin pages use consistent mobile card views (already present on Orders, Products, Customers)
- Verify touch targets are minimum 44x44px on action buttons
- Ensure no horizontal overflow on mobile for tables (already using `overflow-x-auto`)
- Ensure admin sidebar collapses properly on mobile (already handled via `AdminMobileNav`)

---

### Technical Details

**Files to modify:**
1. `src/hooks/useAdminRealtimeDashboard.ts` -- expand subscriptions to all tables
2. `src/pages/admin/AdminAnalytics.tsx` -- add realtime hook
3. `src/pages/admin/AdminOrders.tsx` -- replace local channel with shared hook
4. `src/pages/admin/AdminClinics.tsx` -- add realtime hook
5. `src/pages/admin/AdminDoctors.tsx` -- add realtime hook
6. `src/pages/admin/AdminProducts.tsx` -- add realtime hook
7. `src/pages/admin/AdminCustomers.tsx` -- add realtime hook
8. `src/pages/admin/AdminSocial.tsx` -- add realtime hook
9. `src/pages/admin/AdminContactMessages.tsx` -- add realtime hook
10. `src/pages/admin/AdminCoupons.tsx` -- add realtime hook
11. `src/pages/admin/AdminSettings.tsx` -- add realtime hook

**Database migration:** Enable realtime on 6 additional tables.

**No breaking changes.** All existing functionality is preserved; we are adding realtime listeners and ensuring consistent patterns across all admin pages.

