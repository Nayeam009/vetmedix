
# Resilience Report: Stress and Edge Case Audit

## 1. CRITICAL GAPS

### CRIT-1: No "Delete Account" Feature Exists
**Severity:** High
**Finding:** There is no "Delete Account" button or flow anywhere in the application. Users have no self-service way to delete their account. This is a compliance concern (GDPR right to erasure).

**Cascade analysis (if account were deleted via backend):** The database schema uses `ON DELETE CASCADE` from `auth.users` on `profiles`, `orders`, `appointments`, and `reviews`. However, `pets`, `posts`, `likes`, `comments`, `follows`, `stories`, `wishlists`, `doctor_favorites`, `clinic_favorites`, `incomplete_orders`, and `messages` reference `user_id` WITHOUT a foreign key to `auth.users` -- these would become **zombie data** if a user is deleted directly from `auth.users`.

**Proposed Fix:** This is a design-level decision. For now, flag as a known limitation. If account deletion is desired, an edge function or database function should handle cascading cleanup of all user-owned data across all tables, plus storage file cleanup.

---

### CRIT-2: Orphaned Storage Files on Post/Pet Deletion
**Severity:** High
**Files:** `src/components/social/PostCard.tsx` (line 55-72), `src/pages/EditPetPage.tsx` (line 219-241), `src/hooks/useAdminSocialActions.ts`

When a post is deleted (`PostCard.handleDelete`), only the database row is removed. The associated media files in `pet-media` storage bucket are **never deleted**. Same for pet deletion -- avatar and cover photos remain in storage indefinitely. The admin `useDeletePost` and `useDeletePet` hooks also skip storage cleanup.

Over time this will accumulate orphaned files in the `pet-media` bucket, consuming storage quota.

**Proposed Fix:** Before deleting a post row, extract `media_urls` from the post data and call `supabase.storage.from('pet-media').remove([...paths])`. Same pattern for pet avatar/cover on pet deletion. This requires extracting the storage path from the full public URL.

---

### CRIT-3: CreatePetPage Upload Limit Mismatch
**Severity:** Low
**File:** `src/pages/CreatePetPage.tsx` (line 32, 53-54)

The constant `MAX_IMAGE_SIZE` is set to `20 * 1024 * 1024` (20MB), but the error message says "Image must be less than 5MB". The validation passes files up to 20MB while telling users the limit is 5MB. Since `compressImage` handles reduction anyway, this is mostly a cosmetic bug, but the inconsistency is confusing.

**Proposed Fix:** Change the constant to `5 * 1024 * 1024` to match the error message, OR update the error message to say 20MB.

---

## 2. UX FAILURES

### UX-1: 404 Page Exists and Works -- PASS
The `NotFound` component renders a branded page with a "Return to Home" link. The catch-all `Route path="*"` in `App.tsx` correctly maps to this component.

### UX-2: Offline Indicator Exists -- PASS
`OfflineIndicator` component listens for `online`/`offline` events and shows a fixed banner ("You're offline") with a reconnection message. The `ErrorBoundary` wraps all routes and catches render crashes with a "Try Again" / "Go Home" UI.

### UX-3: Form Validation on CreatePetPage -- Partial
**File:** `src/pages/CreatePetPage.tsx` (line 70-73)

Validation uses manual checks (`if (!name.trim() || !species)`) with a generic `toast.error('Please fill in required fields')` rather than inline field-level errors. The `profileSchema` Zod validation exists in `src/lib/validations.ts` and is used on ProfilePage, but CreatePetPage and EditPetPage do not use Zod or react-hook-form -- they use manual state management.

**Impact:** Users see a single toast instead of knowing which specific field is missing. Not a blocker but below the UX standard set by other forms.

**Proposed Fix:** Not critical. Could adopt `react-hook-form` + Zod on pet forms for consistency, but the current manual validation works.

### UX-4: Console Ref Warning Still Persists
**File:** `src/components/social/PostCard.tsx`

The console logs confirm the warning `"Function components cannot be given refs"` is still firing. The previous fix added `forwardRef` to `PostCardComponent` (confirmed at line 28), but the warning points to `DropdownMenu` specifically -- Radix's `DropdownMenu` root component internally receives a ref from its parent context. The `forwardRef` wrapper correctly absorbs the ref from `TabsContent`, but the warning originates from Radix internals attempting to set a ref on the `DropdownMenu` function component itself.

**Proposed Fix:** This is a Radix UI library-level issue with the installed version. The only true fix is upgrading `@radix-ui/react-dropdown-menu` to a version that uses `forwardRef` internally, or wrapping the `DropdownMenu` in an additional DOM element that absorbs the ref. Since the current `div` wrapper is around the article, we need a `div` wrapper specifically around the `DropdownMenu` component itself.

---

## 3. SECURITY RISKS

### SEC-1: Storage RLS -- No `medical-records` Bucket Exists
**Finding:** There is no `medical-records` storage bucket. The existing buckets are: `pet-media` (public), `product-images` (public), `avatars` (public), `clinic-images` (public), `clinic-documents` (private), `doctor-documents` (private), `cms-media` (public). The private buckets (`clinic-documents`, `doctor-documents`) are correctly non-public, meaning direct URL access requires authentication.

**Status:** No cross-role file deletion risk exists for the current bucket setup since public buckets allow read-only access by default, and storage RLS policies would govern delete operations.

### SEC-2: Session Expiry Handling -- PASS
The Supabase client is configured with `autoRefreshToken: true` and `persistSession: true`. The `onAuthStateChange` listener handles `SIGNED_OUT` events by clearing the query cache. JWT tokens are auto-refreshed before expiry. If refresh fails (e.g., account deleted server-side), the `SIGNED_OUT` event fires and the user is effectively logged out. Pages that require auth (ProfilePage, CheckoutPage, etc.) check `if (!user)` and redirect to `/auth`.

### SEC-3: Password Reset Flow -- PASS
`ForgotPasswordPage` calls `supabase.auth.resetPasswordForEmail` with `redirectTo: window.location.origin + '/reset-password'`. The `ResetPasswordPage` calls `supabase.auth.updateUser({ password })`. The `/reset-password` route exists in `App.tsx`. The flow is complete.

---

## 4. DATA INTEGRITY

### DATA-1: Clinic Deletion Cascade -- SAFE
The `clinic_doctors` table has `clinic_id REFERENCES clinics(id) ON DELETE CASCADE`. If a clinic is deleted, the junction rows in `clinic_doctors` are removed, effectively "unlinking" doctors. The doctors themselves are NOT deleted -- they become unassigned. The `clinic_services` and `appointments` tables also cascade on clinic deletion. This is correct behavior.

### DATA-2: Product Deletion and Order History -- SAFE
Orders store items as a JSONB blob containing product name, price, image, etc. at the time of purchase. Deleting a product does not break order history because the order data is denormalized (snapshot). The `reviews` table cascades on product deletion (`ON DELETE CASCADE`), which is acceptable since reviews for a non-existent product have no value.

### DATA-3: Pet Deletion Does Not Clean Up Storage Files
Same as CRIT-2. When `EditPetPage.handleDelete` deletes a pet, it only removes the database row. The `ON DELETE CASCADE` on `posts.pet_id` correctly removes posts, and cascading further removes likes and comments. However, all media files (pet avatars, covers, post images) remain in `pet-media` storage as orphans.

---

## Summary Table

| ID | Category | Severity | Description |
|----|----------|----------|-------------|
| CRIT-1 | Data Integrity | High | No "Delete Account" feature; zombie data risk across 10+ tables |
| CRIT-2 | Storage | High | Orphaned files in `pet-media` bucket when posts/pets are deleted |
| CRIT-3 | UX Bug | Low | Upload limit constant (20MB) contradicts error message (5MB) |
| UX-4 | Console | Low | DropdownMenu ref warning persists (Radix internals) |

## Proposed Fixes (Prioritized)

### Fix 1: Orphaned Storage Cleanup (CRIT-2)
Modify `PostCard.handleDelete`, `EditPetPage.handleDelete`, `useDeletePost`, and `useDeletePet` to extract storage paths from media URLs and call `supabase.storage.from('pet-media').remove([paths])` before deleting database rows. Requires a utility function to extract the bucket path from a full public URL.

### Fix 2: Upload Limit Message Mismatch (CRIT-3)
In `src/pages/CreatePetPage.tsx`, change line 32 from `20 * 1024 * 1024` to `5 * 1024 * 1024` to match the "5MB" error message on line 54.

### Fix 3: DropdownMenu Ref Warning (UX-4)
Wrap the `DropdownMenu` component in PostCard with an additional `<div>` element to absorb the ref that Radix internally passes to it. This is a targeted wrapper around just the DropdownMenu, not the entire article.

### Deferred: Delete Account (CRIT-1)
This requires a product decision on data retention policy. Implementation would involve a database function that: (1) deletes all user data from ~12 tables, (2) removes storage files, (3) calls `auth.admin.deleteUser()` via an edge function. Recommend deferring to a dedicated sprint.

Total: 3 files for immediate fixes (PostCard.tsx, EditPetPage.tsx, CreatePetPage.tsx) + 1 hook file (useAdminSocialActions.ts) + 1 new utility function. No database changes needed.
