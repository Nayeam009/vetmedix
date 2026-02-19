
# Fix: Doctor List Empty for Unauthenticated Users

## Root Cause (Confirmed)

The `clinic_doctors` table has a SELECT RLS policy that reads:

```
"Authenticated users can view clinic doctors" — USING (true) TO authenticated
```

The `TO authenticated` clause means **anonymous/logged-out visitors get zero rows** from `clinic_doctors`. Since `usePublicDoctors` uses this query to build the list of verified clinic doctor IDs, the result is an empty `verifiedClinicDoctorIds` array. Every doctor gets filtered out, producing "0 doctors found."

The data is fine — 8 doctors, 2 verified clinics, 6 active `clinic_doctors` links all exist in the database.

## Fix

### 1. Database: Add a Public SELECT Policy to `clinic_doctors`

Add a new RLS policy that allows the public (anonymous) role to SELECT from `clinic_doctors`. This is safe because `clinic_doctors` only contains non-sensitive join data (doctor ID, clinic ID, and affiliation status).

```sql
CREATE POLICY "Public can view active clinic doctor affiliations"
ON public.clinic_doctors
FOR SELECT
TO public
USING (status = 'active');
```

This restricts public reads to only `active` affiliations (not pending/rejected ones).

### 2. Code: Harden `usePublicDoctors` with Error Logging

Update `src/hooks/usePublicDoctors.ts` to log errors and data counts so future issues are immediately visible in the browser console. Add a fallback: if `clinic_doctors` returns empty but doctors exist with `is_verified = true`, show them as independent practitioners (already coded but blocked by the RLS gap).

### 3. Code: Improve DoctorsPage Error/Empty State

Update `src/pages/DoctorsPage.tsx` to display a visible red `Alert` banner if the query returns an error object, making future failures immediately diagnosable.

## Why This is Safe

- `clinic_doctors` contains only UUIDs (doctor ID, clinic ID) and status strings — no PII.
- The policy is scoped to `status = 'active'` only, so pending/rejected affiliations remain hidden.
- The `doctors` table itself already has a public view (`doctors_public`) which strips sensitive fields (phone, email, NID, license number) — that security layer is already in place and is not changed.

## Files to Change

| Change | Details |
|---|---|
| Database migration | Add `TO public` SELECT policy on `clinic_doctors` |
| `src/hooks/usePublicDoctors.ts` | Add console logging for debugging; improve independent doctor fallback |
| `src/pages/DoctorsPage.tsx` | Add error state Alert; ensure `isError` from the query is handled |

## Expected Result After Fix

All 6 clinic-affiliated doctors + 2 independent verified doctors = **8 doctors visible** on the `/doctors` page without requiring login.
