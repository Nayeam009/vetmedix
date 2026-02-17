

# Security Vulnerability Report -- Vetmedix

## Severity: CRITICAL

### CRIT-1: `doctor-documents` Bucket -- Any Authenticated User Can Upload
**Bucket:** `doctor-documents` (private)

There are TWO overlapping INSERT policies:
1. `Authenticated users can upload doctor documents` -- allows ANY authenticated user to upload to `doctor-documents` with no folder scoping.
2. `Doctors can upload own documents` -- correctly scopes to `foldername[1] = auth.uid()`.

Policy #1 is overly broad: a Pet Parent could upload arbitrary files into any doctor's folder in the `doctor-documents` bucket. This is a **data poisoning** vector -- an attacker could overwrite a doctor's verification documents.

**Fix:** Drop the overly permissive policy #1. Policy #2 (plus the Clinic Owner upload policy) already covers legitimate use cases.

---

### CRIT-2: `conversations` Table -- No DELETE Policy
**Table:** `conversations`

The `conversations` table has SELECT, INSERT, and UPDATE policies, but **no DELETE policy**. This means:
- No user can delete a conversation (minor UX issue)
- More critically, there is also **no admin override** to clean up abusive conversations or comply with data deletion requests (GDPR/privacy).

**Fix:** Add a DELETE policy for participants (`auth.uid() = participant_1_id OR participant_2_id`) and an admin DELETE policy.

---

### CRIT-3: `profiles_public` View Exposes All Profiles Without Auth
**View:** `profiles_public` (security_invoker=on)

The view selects from `profiles`, and the `profiles` table only has SELECT policies for `user_id = auth.uid()` and admins. Because `security_invoker=on`, anonymous/unauthenticated users get **zero rows** -- this is correct.

However, ANY authenticated user can see their own profile but NOT other users' profiles through this view. This actually **breaks** the social features (viewing other users' names/avatars). The view works because the underlying `profiles` RLS is restrictive, but the code casts through `as any` in several places which may bypass type safety.

**Severity adjusted to Medium** -- functional gap, not a data leak.

---

## Severity: HIGH

### HIGH-1: `clinic_doctors` Table -- Public SELECT Exposes Doctor-Clinic Relationships
**Table:** `clinic_doctors`
**Policy:** "Clinic doctors are viewable by everyone" -- `qual: true`

This allows unauthenticated users to enumerate which doctors belong to which clinics, including the junction table's internal IDs and status fields. While the doctor/clinic names are already public, the `status` field (active/inactive/suspended) is internal operational data that should not be public.

**Fix:** Restrict SELECT to authenticated users, or create a public view that only exposes `doctor_id` and `clinic_id` (not `status` or `id`).

---

### HIGH-2: Clinic Dashboard Has No Centralized Route Guard
**File:** `src/pages/clinic/ClinicDashboard.tsx`

Unlike the Admin panel (which uses `RequireAdmin` wrapper), the Clinic Dashboard performs role checks inline with `if (!isClinicOwner && !isAdmin)` logic scattered across the component. The other clinic routes (`ClinicServices.tsx`, `ClinicDoctors.tsx`, `ClinicProfile.tsx`) need individual verification.

If any clinic route forgets the guard, a Pet Parent could access it by typing the URL directly. The current implementation appears functional but is **fragile** -- there is no centralized `RequireClinicOwner` wrapper.

**Fix:** Create a `RequireClinicOwner` component (mirroring `RequireAdmin`) and wrap all `/clinic/*` routes.

---

### HIGH-3: Doctor Dashboard Has No Centralized Route Guard
**File:** `src/pages/doctor/DoctorDashboard.tsx`

Same pattern as HIGH-2. The Doctor Dashboard checks `if (!isDoctor)` inline. The routes `/doctor/profile` and `/doctor/verification` need individual verification. No centralized `RequireDoctor` wrapper exists.

**Fix:** Create a `RequireDoctor` component and wrap all `/doctor/*` routes.

---

### HIGH-4: `avatars` Bucket -- Any Authenticated User Can Delete Doctor Avatars
**Bucket:** `avatars`
**Policy:** "Authenticated users can delete doctor avatars"

The delete policy for `avatars` in the `doctors` folder only checks `auth.role() = 'authenticated'` -- it does NOT scope to the user's own avatar. Any authenticated user could delete any doctor's avatar.

**Fix:** Add folder-level scoping: `(storage.foldername(name))[2] = auth.uid()::text` or similar user-id-based restriction.

---

## Severity: MEDIUM

### MED-1: `useMessages.ts` Uses `as any` Type Casts Extensively
**File:** `src/hooks/useMessages.ts`

The conversations/messages queries use `.from('conversations' as any)` which bypasses TypeScript type checking. This means:
- No compile-time validation of column names
- Could silently query wrong columns after schema changes
- Hides potential RLS policy mismatches

**Fix:** Ensure `conversations` and `messages` tables are properly typed in the generated Supabase types, then remove `as any` casts.

---

### MED-2: `contact_messages` INSERT Policy Allows Unauthenticated Spam
**Table:** `contact_messages`
**Policy:** "Anyone can submit contact messages" -- `with_check: true`

This is intentional (public contact form), but there is no rate limiting at the database level. An attacker could flood the table with spam entries. The edge function has rate limiting, but direct Supabase client inserts bypass it.

**Fix:** Consider adding a database-level rate limiting trigger, or restrict INSERT to authenticated users only (requiring login to contact).

---

### MED-3: No Account Suspension Enforcement
**Architecture Gap**

When an admin blocks a clinic (`is_blocked = true`) or doctor (`is_blocked = true`), the blocked entities are hidden from public views. However, there is **no mechanism to force-logout a suspended user** or invalidate their session. A blocked clinic owner can still:
- Access their clinic dashboard (until they refresh and re-query)
- Make API calls with their existing JWT until it expires

**Fix:** Add a check in the `AuthContext` or a global middleware that queries the user's block status on critical actions, or use Supabase's `auth.admin.updateUserById` to ban the user at the auth level.

---

### MED-4: `profiles_public` View Has No RLS on View Itself
**View:** `profiles_public`

While `security_invoker=on` delegates to the underlying table's RLS, the view itself has no independent RLS policies listed. If `security_invoker` is ever accidentally removed during a migration, all profile data would become publicly readable.

**Fix:** Add an explicit RLS policy on the view as a defense-in-depth measure, or document this dependency clearly.

---

## Severity: LOW

### LOW-1: `story_views` Table -- No DELETE Policy
Users cannot delete their story view records. Minor privacy concern -- a user cannot remove evidence of having viewed someone's story.

### LOW-2: `reviews` Table -- No DELETE or UPDATE Policies for Users
Users who submit product reviews cannot edit or delete them. This is a UX limitation but not a security issue.

### LOW-3: Public SELECT on Social Tables
Tables `posts`, `comments`, `likes`, `follows`, `pets`, `clinic_reviews`, `reviews` all have `SELECT qual: true`. This is intentional for the social feed, but means all social data is readable by unauthenticated users. Acceptable for the current design but worth noting.

---

## Summary Matrix

| ID | Severity | Category | Issue |
|---|---|---|---|
| CRIT-1 | Critical | Storage RLS | `doctor-documents` bucket allows any authenticated user to upload |
| CRIT-2 | Critical | Table RLS | `conversations` table missing DELETE policy |
| HIGH-1 | High | Table RLS | `clinic_doctors` exposes internal status publicly |
| HIGH-2 | High | Frontend Guard | Clinic routes lack centralized `RequireClinicOwner` wrapper |
| HIGH-3 | High | Frontend Guard | Doctor routes lack centralized `RequireDoctor` wrapper |
| HIGH-4 | High | Storage RLS | `avatars` bucket allows any user to delete doctor avatars |
| MED-1 | Medium | Code Quality | `useMessages.ts` uses `as any` bypassing type safety |
| MED-2 | Medium | Rate Limiting | `contact_messages` INSERT open to spam |
| MED-3 | Medium | Auth | No force-logout on account suspension |
| MED-4 | Medium | Defense-in-Depth | `profiles_public` view relies solely on `security_invoker` |
| LOW-1 | Low | Table RLS | `story_views` missing DELETE policy |
| LOW-2 | Low | Table RLS | `reviews` missing UPDATE/DELETE for users |
| LOW-3 | Low | Design | Social tables publicly readable (by design) |

## Recommended Fix Priority

1. **CRIT-1** -- Drop the overly permissive storage policy (1 SQL statement)
2. **HIGH-4** -- Fix avatar delete policy scoping (1 SQL statement)
3. **HIGH-2 + HIGH-3** -- Create `RequireClinicOwner` and `RequireDoctor` wrappers (2 new components + route updates)
4. **CRIT-2** -- Add conversations DELETE policy (1 SQL migration)
5. **HIGH-1** -- Restrict `clinic_doctors` SELECT or create a public view (1 SQL migration)
6. **MED-3** -- Add block-status check to auth flow (code change)

No code changes will be made until approval is received.

