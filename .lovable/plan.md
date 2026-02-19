
# Fix: Doctor Page & List for All Users + Admin Panel Verification

## Root Cause Diagnosis

Running the live app confirmed the doctors page renders blank. The network calls return data but `doctors_public` returns an **empty array** (`[]`) to anonymous (unauthenticated) users. Here is exactly why:

```text
doctors_public view (security_invoker=on)
  ↓ queries
doctors table
  ↓ has RLS policies: only doctors, admins, clinic owners can SELECT
  ↓ NO public read policy
  
Result: anon callers get [] from the view
```

The `clinic_doctors` join query also has no public RLS policy, but it uses an `!inner` join with `clinics` which has a public read policy for non-blocked clinics — so it happens to return data. But doctor cards still show empty because the doctors list itself is empty.

## Issues Found

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | `doctors` table has no public SELECT policy | Database RLS | Doctors page blank for all unauthenticated/non-doctor users |
| 2 | `clinic_doctors` table has no public SELECT policy | Database RLS | Clinic affiliation join fails for public users |
| 3 | `usePublicDoctors` has no `staleTime`/`gcTime` | `usePublicDoctors.ts` | Redundant refetches on every navigation |
| 4 | Missing `select-role` in the PageTransition renders | App.tsx | Minor — existing, no action needed |

## Fixes

### Fix 1 & 2: Add Public READ Policies (Database Migration)

Two new permissive RLS policies on the base `doctors` table and `clinic_doctors` table so that the public view and join queries can return data to any visitor.

**On `doctors` table:**
```sql
-- Allow public to read non-blocked doctors (for the /doctors listing page)
-- Sensitive fields (email, phone, license_number) are already hidden by the doctors_public view
CREATE POLICY "Public can view non-blocked doctors"
  ON public.doctors FOR SELECT
  USING (is_blocked IS NOT TRUE);
```

**On `clinic_doctors` table:**
```sql
-- Allow public to read active clinic-doctor affiliations (for the /doctors listing page)
CREATE POLICY "Public can view active clinic doctor affiliations"
  ON public.clinic_doctors FOR SELECT
  USING (status = 'active');
```

This is safe because:
- The `doctors_public` view already excludes sensitive fields (email, phone, license_number, NID, BVC certificate URLs)
- The `clinic_doctors` table only contains non-sensitive relational IDs and status
- Blocked doctors are excluded by the USING clause

### Fix 3: Add `staleTime` to `usePublicDoctors`

Add `staleTime: 5 * 60 * 1000` and `gcTime: 10 * 60 * 1000` to avoid redundant network calls on every navigation to the doctors page.

### Fix 4: Admin Panel Connection Verification

From the screenshot, the Admin panel is correctly showing in the navbar and the `AdminDoctors` page is properly connected at `/admin/doctors` with full verify/reject/block workflows. No structural changes needed here — only the data layer fix (above) is required to make the doctor listing appear for public users who can then be managed via admin.

## What Changes

### Database (Migration)

Two new permissive RLS policies:

1. `doctors` table — `"Public can view non-blocked doctors"` SELECT policy with `USING (is_blocked IS NOT TRUE)`
2. `clinic_doctors` table — `"Public can view active clinic doctor affiliations"` SELECT policy with `USING (status = 'active')`

### Code File

**`src/hooks/usePublicDoctors.ts`** — Add `staleTime` and `gcTime` to both `usePublicDoctors` and `usePublicDoctorById` queries to match the pattern used across the rest of the codebase.

## End-to-End Flow After Fix

```text
Visitor lands on /doctors (no login required)
  → usePublicDoctors fires two queries:
      1. clinic_doctors (public policy ✓) → returns active affiliations
      2. doctors_public view (now readable via public policy on doctors ✓) → returns all non-blocked doctors
  → 8 verified doctors render in the grid
  → Filters work (client-side on loaded data)
  → Doctor card "View Profile" → /doctor/:id → usePublicDoctorById works (same fix applies)
  → Doctor card "Book Now" → /book-appointment/:clinicId → existing flow unchanged

Admin logs in → /admin/doctors
  → Fetches from doctors table (admin RLS policy ✓) → sees ALL 8 doctors including full data
  → Can approve, reject, block → mutations update doctors table
  → Invalidates admin-doctors query → list refreshes

Clinic owner adds doctor → clinic_doctors row created
  → status='active' → doctor appears on /doctors listing automatically
```

## Summary: Two DB Policies + One Small Code Tweak

| Change | Type | Risk |
|--------|------|------|
| Add public SELECT policy on `doctors` | DB Migration | Low — excludes blocked doctors; sensitive fields hidden by view |
| Add public SELECT policy on `clinic_doctors` | DB Migration | Low — only exposes relational IDs and status |
| Add `staleTime`/`gcTime` to `usePublicDoctors.ts` | Code | Minimal — performance only |
