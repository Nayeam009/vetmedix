
# System Audit: Admin-to-Frontend Data Flow Fix

## What Was Found

A full audit of the data lifecycle across `doctors`, `clinic_services`, and `appointments` reveals one critical bug and two optimization gaps.

### Critical Bug: Admin Actions Do Not Refresh the Public Doctor List

When an admin approves, rejects, or blocks a doctor in the Admin Panel, the mutation only invalidates the `['admin-doctors']` cache key. The public `/doctors` page uses a **completely different** cache key: `['public-doctors']`. These two caches never talk to each other.

**Result:** A doctor can be approved by an admin, but the public `/doctors` page keeps showing the old list until the user closes and reopens their browser tab. This breaks the "instant update" requirement.

**All locations with this gap:**
- `src/pages/admin/AdminDoctors.tsx` — approve, reject, and block mutations (3 places)
- `src/components/admin/cms/CMSClinicalTab.tsx` — approve and reject mutations (2 places)
- `src/hooks/useClinicOwner.ts` — addDoctor, updateDoctor, removeDoctor mutations (3 places)

### Gap 2: No Auto-Refresh for Availability Status

The `usePublicDoctors` hook has no `refetchInterval`. If a doctor toggles their availability from their dashboard, the change is invisible to users on the public page until they manually refresh. A 60-second `refetchInterval` will keep availability status live.

### Gap 3: No Cross-Invalidation in Realtime Dashboard

The `useAdminRealtimeDashboard` hook does invalidate `['admin-doctors']` when a realtime event fires on the `doctors` table. But it does not cascade to `['public-doctors']`. So even realtime admin-side updates do not propagate to the public frontend.

---

## What is Already Correct (No Changes Needed)

- **RLS Policies:** All correct. The `clinic_doctors` public SELECT policy was fixed in the previous migration. `doctors_public` view is secure and strips PII.
- **TypeScript Types:** `price` is `number | null` in both `ClinicService` (hook) and the DB schema. No mismatch.
- **DoctorCard Broken Image:** Already handled — `AvatarFallback` with initials renders when `avatar_url` is null or broken. No layout shift occurs.
- **Toast Notifications:** All admin mutations already call `toast.success(...)` on success.
- **Loading Skeletons:** 6-card skeleton grid already exists on the DoctorsPage.
- **Error State:** Red `Alert` with retry button already implemented on DoctorsPage.

---

## Files to Change

| File | Change |
|---|---|
| `src/pages/admin/AdminDoctors.tsx` | Add `invalidateQueries(['public-doctors'])` to approve, reject, and block `onSuccess` callbacks |
| `src/components/admin/cms/CMSClinicalTab.tsx` | Same — add cross-invalidation to approve/reject mutations |
| `src/hooks/useClinicOwner.ts` | Add `invalidateQueries(['public-doctors'])` to addDoctor, updateDoctor, removeDoctor `onSuccess` |
| `src/hooks/useAdminRealtimeDashboard.ts` | Add `invalidateQueries(['public-doctors'])` to the `doctors` realtime event handler |
| `src/hooks/usePublicDoctors.ts` | Add `refetchInterval: 60000` and `staleTime: 30000` to keep availability fresh |

---

## Technical Details: The Cross-Invalidation Pattern

Every admin mutation that changes a doctor's state will gain one extra line:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
  queryClient.invalidateQueries({ queryKey: ['public-doctors'] }); // NEW
  toast.success('Doctor approved successfully');
}
```

This causes React Query to mark the public doctor list as stale and silently re-fetch it in the background. Users on the `/doctors` page will see the updated list within milliseconds of the admin saving a change — no page reload required.

---

## Expected Result After Fix

- Admin approves "Dr. Test Verify" in the Admin Panel
- Both `['admin-doctors']` and `['public-doctors']` are invalidated
- React Query re-fetches `usePublicDoctors` in the background
- Within ~500ms, "Dr. Test Verify" appears on the public `/doctors` grid
- No page reload, no manual intervention needed
- Every 60 seconds, availability badges auto-refresh for all users
