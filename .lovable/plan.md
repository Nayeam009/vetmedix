

# Security and QA Report: Red Team Audit

## 1. CRITICAL VULNERABILITIES

### VULN-1: Appointment Slot Check Has Race Condition (Medium-High)
**File**: `src/pages/BookAppointmentPage.tsx` (lines 75-99)

The booking flow checks for existing slots client-side using a SELECT query, then inserts. Two users clicking "Book" on the same slot simultaneously can both pass the check before either insert completes, resulting in a double-booking.

**Fix**: Add a unique constraint on `(clinic_id, doctor_id, appointment_date, appointment_time)` where status is not cancelled/rejected, or use a database function with row-level locking to atomically check-and-insert.

### VULN-2: Stock Decrement is Not Atomic with Order Insert (Medium)
**File**: `src/pages/CheckoutPage.tsx` (lines 282-285)

The checkout flow inserts the order first, then loops through items calling `decrement_stock` one-by-one. If the page crashes or network drops after the insert but before all decrements complete, inventory becomes desynchronized. Additionally, the stock check (line 243) and decrement are not in a transaction, allowing two concurrent checkouts to both pass the stock check.

**Fix**: Wrap the order insert + stock decrement in a single database function (`create_order_with_stock`) that runs as a transaction. This eliminates the race window entirely.

### VULN-3: Unguarded `console.error` in Production (Low)
**Files**: `src/pages/AuthPage.tsx`, `src/pages/ForgotPasswordPage.tsx`, `src/contexts/AuthContext.tsx`, `src/hooks/useDoctorJoinRequests.ts`, `src/hooks/useAppointments.ts`, `src/components/admin/ImageUpload.tsx`, and 30+ other files

436 `console.error()` calls found across 38 files, most NOT guarded behind `import.meta.env.DEV`. While `console.error` is less sensitive than `console.log`, it still leaks internal error details (Supabase error codes, table names, policy info) to anyone inspecting the browser console.

**Fix**: Wrap all `console.error` calls in a dev-only guard, or create a centralized `logger.error()` utility that silences output in production.

---

## 2. LOGIC BUGS

### BUG-1: User Can Only Have ONE Role (By Policy Design) -- But UI Implies Multi-Role
**Table**: `user_roles` RLS policy: "Users can insert their own role"

The INSERT policy includes: `NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())`. This means a user can only ever insert ONE role. If they signed up as "Pet Parent" and later want to also be a "Doctor," the insert will be silently blocked by RLS.

This is intentional security, but the `useUserRole` hook returns `roles: UserRoleType[]` (an array), implying multi-role support. The admin can manually add roles, but users cannot add secondary roles themselves.

**Status**: Not a bug per se -- the policy is correctly restrictive. But document that role changes require admin action.

### BUG-2: SelectRolePage Accessible Without Guard
**File**: `src/pages/SelectRolePage.tsx` (line 278)

If `!user`, the page calls `navigate('/auth')` and returns `null`. However, this runs during render (not in a useEffect), which triggers a React warning about state updates during render. It works functionally but is technically incorrect.

**Fix**: Move the redirect into the existing `useEffect` block.

---

## 3. VERIFIED SAFE (No Issues Found)

| Check | Status | Evidence |
|-------|--------|----------|
| Profile auto-creation on signup | PASS | `handle_new_user()` trigger creates `profiles` row via `ON INSERT` on `auth.users` |
| Session persistence (F5 reload) | PASS | `AuthContext` uses `onAuthStateChange` listener set up BEFORE `getSession()` -- correct order, no race condition |
| Duplicate email signup | PASS | `signUp()` catches "already registered" and returns a clear error message displayed via toast |
| Password recovery flow | PASS | `resetPasswordForEmail` with correct `redirectTo`, `ResetPasswordPage` calls `updateUser({ password })` |
| Admin route protection | PASS | `RequireAdmin` wrapper checks role via `useAdmin` hook, redirects non-admins |
| Clinic Dashboard guard | PASS | Checks `isClinicOwner`, `isAdmin`, shows "Access Denied" for Pet Parents |
| Doctor Dashboard guard | PASS | Checks `isDoctor` role, shows "Access Denied" for others |
| RLS: Pet Parent reading Clinic Owner data | PASS | `clinics` table policies restrict sensitive fields; public data served via `clinics_public` view |
| RLS: Unauthenticated data access | PASS | All tables require `auth.uid()` for mutations; public SELECT limited to non-sensitive views |
| Roles stored in separate table | PASS | `user_roles` table, never on `profiles` |
| Admin check not client-side | PASS | `has_role()` is `SECURITY DEFINER`, server-side check |
| Stock decrement function | PASS | `decrement_stock` uses `GREATEST(stock - p_quantity, 0)` preventing negative stock |
| Coupon increment | PASS | `increment_coupon_usage` is atomic RPC |
| Console.log in production | PASS | All `console.log` calls are in `analytics.ts`, guarded by `import.meta.env.DEV` |
| OAuth flows (Google/Apple) | PASS | Uses `lovable.auth.signInWithOAuth` correctly with redirect_uri |
| Zod validation on forms | PASS | Login, signup, clinic owner signup, and checkout all validated |

---

## 4. UX ISSUES

### UX-1: ForgotPasswordPage Leaks Error Details (Low)
**File**: `src/pages/ForgotPasswordPage.tsx` (line 38)

On error, the raw Supabase error message is displayed to the user: `toast.error(error.message || 'Failed to send reset link')`. Supabase may return messages like "Email rate limit exceeded" which is fine, but in edge cases could reveal internal details.

**Fix**: Map known error messages to user-friendly strings.

---

## Summary Table

| ID | Category | Severity | Description |
|----|----------|----------|-------------|
| VULN-1 | Security | Medium-High | Appointment booking race condition (double-booking) |
| VULN-2 | Security | Medium | Checkout stock decrement not transactional |
| VULN-3 | Security | Low | 436 unguarded `console.error` calls leak internals |
| BUG-2 | Logic | Low | SelectRolePage redirect during render |
| UX-1 | UX | Low | Raw error messages in ForgotPasswordPage |

## Proposed Fixes (Awaiting Approval)

1. **VULN-1**: Create a database function `book_appointment_atomic(...)` that checks slot availability and inserts in one transaction. Add a partial unique index on appointments to prevent duplicates at the DB level.

2. **VULN-2**: Create a database function `create_order_with_stock(...)` that inserts the order and decrements stock atomically. Replace the current multi-step client-side logic.

3. **VULN-3**: Create a `src/lib/logger.ts` utility that wraps `console.error` and silences it in production. Find-and-replace across affected files.

4. **BUG-2**: Move the `navigate('/auth')` call from render-time into the existing `useEffect` in `SelectRolePage.tsx`.

5. **UX-1**: Add error message mapping in `ForgotPasswordPage.tsx`.

