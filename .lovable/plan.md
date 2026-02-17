

# Critical Bug Report: Vetmedix Codebase Audit

## CRITICAL Issues (Security / Data Integrity / App Crashes)

### C1. Stock Not Decremented After Purchase
- **Severity:** CRITICAL -- Revenue integrity
- **Location:** `src/pages/CheckoutPage.tsx` (lines 234-311)
- **Problem:** The checkout flow validates stock before placing an order, but never decrements the product stock count in the database after a successful order. Stock levels remain unchanged, meaning products can be oversold indefinitely.
- **Root Cause:** No `UPDATE products SET stock = stock - quantity` call exists anywhere in the codebase after order insertion.
- **Impact:** Unlimited purchases of out-of-stock items; admin dashboard shows incorrect inventory.
- **Fix:** After successful order insertion (line 271), loop through items and decrement stock. Use a database function or transaction to ensure atomicity and prevent race conditions.

### C2. Appointment Slots Not Blocked -- Double Booking Possible
- **Severity:** CRITICAL -- Trust engine
- **Location:** `src/pages/BookAppointmentPage.tsx` (lines 60-80), `appointments` table
- **Problem:** When a user books an appointment, the system simply inserts a row. There is no check for existing bookings at the same clinic + doctor + date + time combination. Two users can book the exact same slot simultaneously.
- **Root Cause:** No unique constraint on `(clinic_id, doctor_id, appointment_date, appointment_time)` and no pre-insert validation query.
- **Impact:** Double-booked appointments, clinic confusion, lost trust.
- **Fix:** Add a unique constraint or a pre-insert check query. Also filter out already-booked time slots in the `BookAppointmentWizard` by fetching existing appointments for the selected date.

### C3. 12 Admin Pages Lack RequireAdmin Guard
- **Severity:** CRITICAL -- Security
- **Location:** All admin pages except `AdminDashboard`, `AdminCMS`, `AdminCMSEditor`, `AdminSettings`
- **Pages without RequireAdmin:** `AdminProducts`, `AdminOrders`, `AdminCustomers`, `AdminAnalytics`, `AdminClinics`, `AdminSocial`, `AdminDoctors`, `AdminContactMessages`, `AdminCoupons`, `AdminIncompleteOrders`, `AdminRecoveryAnalytics`, `AdminEcommerceCustomers`, `AdminDeliveryZones`
- **Problem:** These pages use inline `useEffect` redirects instead of the centralized `RequireAdmin` wrapper. While the inline guard does redirect, it:
  - Briefly renders the admin layout before redirecting (flash of admin content)
  - Duplicates ~20 lines of guard logic per page
  - Shows inconsistent loading/error states
- **Impact:** Momentary exposure of admin UI to unauthorized users; maintenance burden.
- **Fix:** Wrap each page in `<RequireAdmin>` and remove the manual `useEffect` guard + inline access-denied render blocks.

### C4. CLS Score 3.95 (Poor) -- Layout Shift
- **Severity:** CRITICAL -- Performance / UX
- **Source:** Console logs show CLS escalating from 1.78 to 3.95
- **Problem:** The admin dashboard has extreme Cumulative Layout Shift, likely caused by:
  - Lazy-loaded components rendering without skeleton placeholders of matching dimensions
  - Stat cards loading asynchronously and pushing content down
  - The sidebar collapse/expand transition shifting the main content area
- **Impact:** Poor Core Web Vitals score; janky user experience, especially on slower connections.
- **Fix:** Ensure all lazy-loaded admin components have dimension-matched skeleton loaders. Add `min-h` constraints to stat card containers to reserve space.

---

## MAJOR Issues (Broken UI / Logic Gaps)

### M1. DialogTitle Accessibility Errors (Console Spam)
- **Severity:** MAJOR -- Accessibility / Console pollution
- **Source:** Console errors on `/admin` route
- **Problem:** Multiple `DialogContent` components across admin pages lack `DialogTitle`, causing Radix to throw errors. This affects screen readers and floods the console.
- **Files to audit:** All admin pages that import `Dialog` or `DialogContent` -- approximately `AdminOrders`, `AdminProducts`, `AdminSocial`, `AdminDoctors`, `AdminClinics`, `AdminCoupons`, `AdminContactMessages`.
- **Fix:** Add `DialogTitle` (visually hidden if needed) to every `DialogContent` instance across admin pages.

### M2. Admin Orders Page Uses Manual Auth Guard (Duplicate of C3)
- **Severity:** MAJOR
- **Location:** `src/pages/admin/AdminOrders.tsx` (lines 112-118, 424-435)
- **Problem:** Same manual `useEffect` redirect pattern + inline "Access Denied" UI block. This page is the most business-critical admin page.
- **Fix:** Wrap in `<RequireAdmin>` and remove manual guard.

### M3. Coupon Usage Increment Has Race Condition
- **Severity:** MAJOR -- Data integrity
- **Location:** `src/pages/CheckoutPage.tsx` (lines 274-279)
- **Problem:** The coupon `used_count` is incremented via a read-then-write pattern: fetch current count, then update with count + 1. Two simultaneous checkouts using the same coupon could both read the same count and increment to the same value, losing one increment.
- **Fix:** Use a single atomic SQL update: `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?` instead of the read-then-write pattern.

### M4. Checkout Does Not Require Authentication at Route Level
- **Severity:** MAJOR -- UX gap
- **Location:** `src/pages/CheckoutPage.tsx`, `src/App.tsx` (line 150)
- **Problem:** The checkout page is publicly accessible. An unauthenticated user can fill out the entire form, only to be redirected to `/auth` on submit (line 201-209). Cart data stored in localStorage means they lose context after login redirect.
- **Fix:** Add an auth check at mount time or protect the route.

---

## Additional Findings

### Security Observations (RLS)
- **Pet Parent / Clinic Owner isolation:** Clinic financial data (orders, revenue) is protected via RLS -- only admins can SELECT from `orders`. Pet parents can only see their own orders. Clinic owners cannot see other clinics' orders. This is correctly configured.
- **Doctor patient visibility:** Doctors can only view appointments where `doctor_id` matches their own doctor record (via RLS). This is correctly scoped.
- **Social tables:** Admin DELETE policies on `posts`, `comments`, `likes`, `pets`, `stories`, `follows` were added in the recent migration -- these are now correctly configured.

### Performance Observations
- All page routes are already lazy-loaded via `React.lazy()` in `App.tsx`.
- No fixed-width elements found that would break on mobile. The admin layout uses responsive `md:` breakpoints correctly after the recent refinement.
- The `manualChunks` configuration in `vite.config.ts` properly splits vendor bundles.

---

## Implementation Priority

| Priority | Issue | Type |
|----------|-------|------|
| P0 | C1: Stock not decremented after purchase | Data integrity |
| P0 | C2: Double-booking possible (no slot blocking) | Logic gap |
| P0 | C3: 12 admin pages lack RequireAdmin | Security |
| P1 | C4: CLS 3.95 -- layout shift | Performance |
| P1 | M1: DialogTitle accessibility errors | Accessibility |
| P1 | M3: Coupon race condition | Data integrity |
| P1 | M4: Checkout no auth guard at mount | UX |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CheckoutPage.tsx` | Add stock decrement after order, atomic coupon update, early auth check |
| `src/pages/BookAppointmentPage.tsx` | Add slot availability check before insert |
| `supabase/migrations/xxx.sql` | Add unique constraint or check on appointments; create stock decrement function |
| 12 admin pages | Wrap in `<RequireAdmin>`, remove manual guards |
| Multiple admin dialog files | Add `DialogTitle` to all `DialogContent` |
| Admin dashboard components | Add dimension-matched skeletons to reduce CLS |

