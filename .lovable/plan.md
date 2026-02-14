

# Comprehensive Data Accuracy and Realtime Fix Plan

## Summary of Issues Found

After auditing all pages, hooks, database queries, and realtime subscriptions, here are the concrete issues discovered:

---

## Issue 1: Appointment Cancellation Does Not Update Profile Page (Critical)

**Problem**: When a user cancels an appointment from the Profile page, the appointment list does NOT refresh. The `useAppointmentActions` hook invalidates cache keys `['appointments']` and `['userAppointments']`, but the Profile page fetches with `['user-appointments', user?.id]` -- a completely different key.

**Fix**: Update `useAppointmentActions` to also invalidate `['user-appointments']` so the Profile page refreshes after cancellation.

---

## Issue 2: Profile Page Missing Realtime for Appointments (Critical)

**Problem**: The Profile page has realtime for order status updates but NOT for appointment status changes. When a clinic owner confirms or cancels a user's appointment, the user's Profile page does not update until they refresh.

**Fix**: Add a Supabase realtime subscription for `appointments` filtered by `user_id` on the Profile page, similar to the existing order subscription.

---

## Issue 3: Doctor Dashboard "Total Patients" Label is Misleading

**Problem**: The Doctor Dashboard stat card labeled "Total Patients" actually shows the total number of appointments (`doctorAppointments?.length`), not unique patients. A single patient with 3 visits would count as 3.

**Fix**: Rename the label to "Total Appointments" which accurately describes the data.

---

## Issue 4: Missing Realtime Tables in Publication

**Problem**: Several tables used by realtime-dependent features are NOT in the `supabase_realtime` publication. This means Supabase will silently ignore subscription attempts for these tables.

Missing tables: `messages`, `conversations`, `likes`, `comments`, `follows`, `clinic_doctors`, `clinic_services`, `clinic_reviews`, `pets`, `stories`

**Fix**: Add all missing tables to the `supabase_realtime` publication via migration.

---

## Issue 5: ClinicsPage Uses Raw State Instead of React Query

**Problem**: The Clinics public listing page (`ClinicsPage.tsx`) fetches data with raw `useState`/`useEffect` instead of React Query. This means:
- No caching (re-fetches on every visit)
- No automatic stale-time management
- No realtime integration possible

**Fix**: Refactor to use React Query with a proper cache key so it benefits from the admin realtime system and caching.

---

## Issue 6: Admin Dashboard Revenue Shows Correct Data (Not a Bug)

**Finding**: All 6 orders in the database are cancelled. Active Revenue = 0, Active Orders = 0, Cancelled Revenue = 15,070. The dashboard numbers ARE correct. The "Order Fulfillment 0%" is accurate because there are zero active orders. No code change needed -- this is real data.

---

## Issue 7: Clinic Dashboard Missing Realtime for Doctors and Services

**Problem**: The clinic dashboard subscribes to appointment changes in realtime, but NOT to `clinic_doctors` or `clinic_services` changes. If a doctor is added/removed or a service is updated from another session, the dashboard won't reflect it.

**Fix**: Extend the clinic dashboard realtime channel to also subscribe to `clinic_doctors` and `clinic_services` changes filtered by `clinic_id`.

---

## Issue 8: ShopPage Products Not Realtime

**Problem**: The Shop page fetches products with raw `useState`/`useEffect`. If an admin updates product stock, price, or availability, the Shop page won't reflect changes until the user refreshes.

**Fix**: Refactor to React Query and add realtime subscription for the `products` table.

---

## Technical Implementation Details

### Migration (SQL)
```sql
-- Add missing tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
```

### Files to Edit

1. **`src/hooks/useAppointments.ts`** -- Fix cache key invalidation to include `['user-appointments']`
2. **`src/pages/ProfilePage.tsx`** -- Add realtime subscription for appointments
3. **`src/pages/doctor/DoctorDashboard.tsx`** -- Rename "Total Patients" to "Total Appointments"
4. **`src/pages/clinic/ClinicDashboard.tsx`** -- Add realtime for `clinic_doctors` and `clinic_services`
5. **`src/pages/ClinicsPage.tsx`** -- Refactor from raw state to React Query
6. **`src/pages/ShopPage.tsx`** -- Refactor from raw state to React Query + realtime

### Estimated Changes
- 1 database migration
- 6 file edits
- No new files needed
- No breaking changes

