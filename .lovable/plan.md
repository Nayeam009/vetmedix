
# Phase 2: Engine-Specific Fixes

This plan addresses all three engines (Social, E-commerce, Trust) with targeted fixes based on the audit findings and current codebase state.

---

## A. Engagement Engine (Social Feed)

### A1. Feed Virtualization for Smooth Mobile Scrolling
- The feed currently renders all loaded posts in a flat list. On mobile with many posts, this causes jank during scrolling.
- Add CSS `content-visibility: auto` with `contain-intrinsic-size` on each PostCard wrapper in the feed to enable browser-native virtualization (lightweight, no new dependency needed).
- This approach works with the existing infinite scroll sentinel pattern.

### A2. Image Upload Rendering Fix
- The `CreatePostCard` compresses images before upload, but the `PostCard` media grid doesn't enforce `aspect-ratio` on individual media items, which can cause CLS when images load.
- Add explicit `width` and `height` attributes to `LazyImage` in the PostCard media grid to prevent layout shift.
- Ensure fallback skeleton placeholder dimensions match the final rendered image size.

### A3. Optimistic UI Already Implemented -- Verify & Harden
- Like/Unlike already uses optimistic updates in `usePosts` hook (confirmed in code review).
- Comments section needs verification -- ensure the comment count updates optimistically when a user posts a comment.
- Add a debounce guard on the like button to prevent double-tap race conditions on mobile (the current `isLiking` state resets after 300ms but doesn't actually block rapid clicks).

---

## B. Revenue Engine (E-commerce)

### B1. Checkout Flow -- Already Fixed (Verify)
- Stock decrement (C1), atomic coupon increment (M3), and auth guard at mount (M4) were implemented in the previous phase.
- Verify the `decrement_stock` and `increment_coupon_usage` RPC functions are deployed and callable.

### B2. Cart Persistence -- Already Working
- Cart state is persisted via `localStorage` in `CartContext` (confirmed in code review). No fix needed.

### B3. Product Image CLS Prevention
- `ProductCard` already uses `AspectRatio` with ratio={1} wrapping `OptimizedImage` -- this is correctly preventing CLS.
- The `ShopPage` product grid needs `min-h` constraints on the grid container to reserve space while products load, similar to the admin dashboard fix.

### B4. Real-Time Stock Updates for Users
- When an admin updates stock via the Quick Stock Update feature, regular users on the Shop page should see the change.
- Enable Supabase Realtime on the `products` table and add a subscription in `ShopPage` that invalidates the React Query cache when product data changes.
- This ensures stock badges ("Stock Out", "X left") update without page refresh.

---

## C. Trust Engine (Clinic and Doctor)

### C1. RLS Verification -- Already Secure
- Reviewed all RLS policies on `appointments`, `clinics`, `doctors`, `clinic_doctors` tables.
- Doctors can only view appointments where `doctor_id` matches their own record (via `get_doctor_id(auth.uid())`).
- Clinic owners can only view appointments/doctors for their own clinic (via `is_clinic_owner` or `owner_user_id` check).
- No cross-clinic data leakage found.

### C2. Appointment Calendar Mobile Responsiveness
- `ClinicAppointmentsList` already uses a Card-based layout (not a table) with grouped-by-date cards. This is mobile-friendly.
- Improve the time badge and action buttons sizing for small screens -- ensure touch targets remain at least 44x44px.
- Add horizontal scrolling safeguard on the status filter pills (already implemented with `overflow-x-auto`).

### C3. Clinic Owner Edit Flow Verification
- The `ClinicProfile` page allows clinic owners to edit details. Verify the update mutation uses the correct RLS policy (`owner_user_id = auth.uid()`).
- Ensure the edit form doesn't submit empty required fields (clinic `name` is NOT NULL).

### C4. Appointment Slot Filtering in Wizard
- The `BookAppointmentWizard` shows available time slots based on doctor schedules, but doesn't filter out already-booked slots.
- Fetch existing appointments for the selected date/doctor from the `appointments` table and grey out or hide already-taken time slots.
- This gives users visual feedback before they attempt to book, complementing the server-side duplicate check added in Phase 1.

---

## Technical Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/FeedPage.tsx` | Add `content-visibility` CSS optimization on post wrappers |
| `src/components/social/PostCard.tsx` | Harden like button with debounce guard |
| `src/components/social/LazyMedia.tsx` | Add explicit width/height for CLS prevention |
| `src/pages/ShopPage.tsx` | Add `min-h` on product grid, add realtime subscription for products |
| `src/components/booking/BookAppointmentWizard.tsx` | Fetch booked slots and filter available times |
| `src/pages/clinic/ClinicDashboard.tsx` | Minor touch target adjustments |

### New Migration
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.products;` to enable real-time stock sync for shoppers.

### No New Dependencies Required
- All optimizations use existing browser APIs (`content-visibility`, `IntersectionObserver`) and existing Supabase Realtime SDK.
