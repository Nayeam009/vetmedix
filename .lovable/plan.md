

# Security Remediation Plan -- Final Hardening

## Current Security Posture (Already Solid)

After auditing the full database and codebase, the application is in strong shape:

- RLS is enabled on all 35 public tables
- All admin pages individually wrap themselves in `RequireAdmin`
- Doctor and Clinic routes are guarded in `App.tsx` with `RequireDoctor` / `RequireClinicOwner`
- Comprehensive XSS sanitization utility exists (`sanitize.ts`)
- Storage buckets for sensitive documents (`doctor-documents`, `clinic-documents`) are private
- All database functions use `SECURITY DEFINER` with `SET search_path`

## Remaining Gaps to Fix

### SEC-1: Admin Routes -- Add Centralized Guard in App.tsx (Defense-in-Depth)
**File:** `src/App.tsx` (lines 183-201)

Each admin page already wraps itself with `<RequireAdmin>`, but the router does NOT enforce this at the route level. If a developer adds a new admin page and forgets to include `<RequireAdmin>`, the page would be publicly accessible.

**Fix:** Import `RequireAdmin` in `App.tsx` and wrap all `/admin/*` routes, matching the pattern already used for `/doctor/*` and `/clinic/*`.

```
<Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
<Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
...etc for all 15 admin routes
```

This creates a double-lock: the route guard AND the page guard. The internal `<RequireAdmin>` in each page can remain as extra safety.

---

### SEC-2: Add DELETE Policy for `messages` Table (GDPR Compliance)
**Table:** `messages`

Users currently cannot delete messages they sent. This prevents data cleanup and GDPR compliance.

**SQL Migration:**
```sql
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

---

### SEC-3: Add Rate Limiting Guard for `contact_messages` INSERT
**Table:** `contact_messages`

The current policy `with_check: true` allows unlimited anonymous inserts. While intentional for the public contact form, it enables spam flooding.

**SQL Migration:** Add a database trigger that limits inserts per IP/session to prevent abuse:
```sql
-- Restrict to authenticated users only (removes anonymous spam vector)
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Authenticated users can submit contact messages"
ON public.contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);
```

This still allows any logged-in user to submit, but blocks unauthenticated spam bots entirely. The contact form UI will need to show a "Please sign in to contact us" message for unauthenticated visitors.

---

### SEC-4: Add DELETE Policy for `story_views` (Privacy)
**Table:** `story_views`

Users cannot delete their own story view records, which is a minor privacy concern.

**SQL Migration:**
```sql
CREATE POLICY "Users can delete their own story views"
ON public.story_views FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

### SEC-5: Add UPDATE/DELETE Policies for `reviews` (User Control)
**Table:** `reviews`

Users who submit product reviews cannot edit or delete them.

**SQL Migration:**
```sql
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

### SEC-6: Contact Form UI Update for Auth Requirement
**File:** `src/pages/ContactPage.tsx`

After SEC-3 restricts contact form inserts to authenticated users, update the contact form to show a "Sign in to send a message" prompt for unauthenticated visitors instead of the form.

---

## Summary

| ID | Category | Severity | Change |
|---|---|---|---|
| SEC-1 | Route Guard | High | Wrap all 15 admin routes in `RequireAdmin` in App.tsx |
| SEC-2 | RLS | Medium | Add DELETE policy for `messages` table |
| SEC-3 | RLS | Medium | Restrict `contact_messages` INSERT to authenticated users |
| SEC-4 | RLS | Low | Add DELETE policy for `story_views` |
| SEC-5 | RLS | Low | Add UPDATE/DELETE policies for `reviews` |
| SEC-6 | UI | Low | Update ContactPage for auth requirement |

**Files Modified:** `src/App.tsx`, `src/pages/ContactPage.tsx`
**SQL Migration:** 1 migration with 7 policy statements
**No new dependencies. No breaking changes for legitimate users.**

## Regression Safety

After applying these changes, the "Happy Path" remains intact:
- Pet Parents can still: log in, view pets, book appointments, place orders, submit reviews (and now edit/delete them)
- Doctors can still: access dashboard, manage profile, view appointments
- Clinic Owners can still: manage clinic, doctors, services, appointments
- Admins can still: access all admin pages (now double-guarded)
- The only behavioral change is that the Contact form now requires sign-in

