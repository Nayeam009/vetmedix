

# VET-MEDIX: Comprehensive Problem PRP -- Regression & Audit Report

---

## Executive Summary

After exhaustive code-level analysis across 200+ files, 34 database tables, 5 edge functions, and 15+ realtime subscriptions, this audit catalogs every remaining issue by domain. Many previously reported issues (M1 CartContext memoization, M2 DoctorCard/ClinicCard memo, H1 Object URL revocations, H3 admin realtime splitting, L1 dead category UI) have been **verified as fixed**. The remaining issues fall into type safety, minor performance gaps, and a few architectural concerns.

---

## DOMAIN 1: Build, State & Architecture

### 1.1 Stale `console.log` in Production Code
- **File:** `src/contexts/CartContext.tsx` line 37
- **Issue:** `console.log('CartProvider naturally mounted')` is left in. Ships to production, pollutes user console.
- **Risk:** Low
- **Fix:** Remove the debug log statement.

### 1.2 `queryClient` at Module Scope -- HMR Cache Loss (Dev Only)
- **File:** `src/App.tsx` line 86
- **Issue:** `const queryClient = new QueryClient(...)` is defined outside the component. During Vite HMR, the module re-executes and creates a new instance, losing all cached data and causing flash-of-loading states.
- **Risk:** Low (dev-only, no production impact)
- **Fix:** Acceptable as-is. Optional: wrap in a module-level singleton guard.

### 1.3 `PetContext` Missing `useMemo` on Provider Value
- **File:** `src/contexts/PetContext.tsx` line 64-66
- **Issue:** The provider value `{ pets, activePet, setActivePet, loading, refreshPets }` is an object literal, creating a new reference on every render. While `refreshPets` uses `useCallback`, the value object itself does not use `useMemo`, causing all consumers (PetSwitcher, CreatePostCard, FeedPage) to re-render on unrelated parent renders.
- **Risk:** Medium -- affects social feed performance.
- **Fix:** Wrap the value in `useMemo` depending on `pets`, `activePet`, `loading`, and `refreshPets`.

### 1.4 `WishlistContext` `toggleWishlist` Stale Closure on `wishlistIds`
- **File:** `src/contexts/WishlistContext.tsx` line 82
- **Issue:** `toggleWishlist` is wrapped in `useCallback` with `[user, wishlistIds]` as dependencies. Since `wishlistIds` is a `Set` (reference type) that changes on every toggle, this re-creates `toggleWishlist` on every change, which in turn causes the memoized `contextValue` (line 86) to change, and all consumers re-render. This partially negates the optimization.
- **Risk:** Low -- wishlist operations are infrequent.
- **Fix:** Use a ref for `wishlistIds` inside `toggleWishlist` (same pattern as PetContext's `activePetRef`).

### 1.5 AdminSettings -- Missing Object URL Cleanup on Unmount
- **File:** `src/pages/admin/AdminSettings.tsx` lines 311-320
- **Issue:** `handleFileChange` correctly revokes old blob URLs when new files are selected, but there is no `useEffect` cleanup to revoke on component unmount. If the admin navigates away with an unsaved logo/favicon preview, the blob URL leaks.
- **Risk:** Low (single admin page, small memory impact)
- **Fix:** Add `useEffect(() => { return () => { if (logoPreview?.startsWith('blob:'))... }; }, []);`

---

## DOMAIN 2: Routing & Missing Pages

### 2.1 All 17 Admin Routes -- VERIFIED PRESENT
Cross-referencing App.tsx lines 185-202 against the PRP: all 17 admin routes are registered and guarded by `<RequireAdmin>`. The CMS editor uses `/admin/cms/new` and `/admin/cms/:id/edit` (not `/admin/cms/editor` as noted in the PRP -- this is a PRP documentation mismatch, not a code bug).

### 2.2 Doctor & Clinic Owner Routes -- VERIFIED PRESENT
All 3 doctor routes and 5 clinic owner routes are registered with proper guards.

### 2.3 Unauthenticated Routes Allow Social Features
- **Files:** `src/App.tsx` lines 167-171
- **Issue:** `/feed`, `/explore`, `/messages`, `/notifications`, `/chat/:conversationId` are not wrapped in any auth guard. While RLS prevents data access, unauthenticated users can navigate to these pages and see empty/broken states instead of being redirected to `/auth`.
- **Risk:** Medium -- poor UX for logged-out users hitting social URLs.
- **Fix:** Wrap social routes in a lightweight `<RequireAuth>` component that redirects to `/auth`.

### 2.4 No Route for `/pets/:id/edit` Auth Guard
- **File:** `src/App.tsx` line 174
- **Issue:** `/pets/:id/edit` is accessible without auth. The `EditPetPage` itself likely checks `user`, but if a logged-out user navigates directly, they'll see a broken page rather than a redirect.
- **Risk:** Low -- RLS blocks mutations.

---

## DOMAIN 3: Type Safety (`as any` Audit)

### 3.1 Remaining `as any` Casts -- 239 Instances Across 13 Files

**Critical hotspots (data integrity risk):**

| File | Count | Pattern |
|------|-------|---------|
| `AdminOrders.tsx` | ~15 | `(order as any).trashed_at`, `(order as any).items`, `(order as any).tracking_id`, `status as any` |
| `ChatPage.tsx` | ~5 | `('conversations' as any)`, `(conv as any).participant_1_id` |
| `WishlistPage.tsx` | ~3 | `setFavoriteClinics(data as any)`, `setFavoriteDoctors(data as any)` |
| `useCMS.ts` | ~3 | `insert(payload as any)`, `update(updates as any)` |
| `useMessages.ts` | ~2 | `(lastMessages || []) as any[]` |
| `SendToCourierDialog.tsx` | ~2 | `(order as any).items` |
| `ShopPage.tsx` | ~1 | `setPriceRange(option.value as any)` |

**Root cause:** The auto-generated `types.ts` from the database schema doesn't include joined/computed fields. Components cast to `any` instead of defining proper interfaces for joined query results.

**Fix:** Define typed interfaces (e.g., `OrderWithProfile`, `ConversationWithParticipants`, `FavoriteWithDoctor`) and use generic type parameters on Supabase queries.

---

## DOMAIN 4: UI/UX & Component Issues

### 4.1 Checkout Form -- No `react-hook-form` Integration
- **File:** `src/pages/CheckoutPage.tsx` (845 lines)
- **Issue:** This is the most critical form in the app, yet it uses manual `useState` for form fields and manual Zod validation (`checkoutSchema.safeParse`) instead of `react-hook-form` + `@hookform/resolvers/zod`. This means:
  - No per-field error display (errors are shown as toasts only)
  - No `isDirty`/`isValid` tracking
  - Double-click protection relies solely on `disabled={loading}` -- if the async fails fast, the button re-enables immediately
- **Risk:** Medium -- double-submission is partially mitigated by the `loading` state, but error UX is poor.
- **Fix:** Migrate to `react-hook-form` with `zodResolver(checkoutSchema)` for inline field errors.

### 4.2 Contact Form -- Lacks Cooldown/Rate Limiting
- **File:** `src/pages/ContactPage.tsx`
- **Issue:** After successful submission, `setSubmitted(true)` shows a success screen, but there's no cooldown timer preventing rapid re-submissions before the success state renders. The button is disabled only during the async operation.
- **Risk:** Low -- RLS doesn't restrict contact message inserts (anyone can insert).
- **Fix:** Add a 3-second cooldown after submission.

### 4.3 Missing `ExplorePetCard` and `PostCardSkeleton` Memo
- **File:** `src/components/explore/ExplorePetCard.tsx`, `src/components/social/PostCardSkeleton.tsx`
- **Issue:** These are rendered in lists/grids but search for `memo` shows no usage in these files.
- **Risk:** Low -- skeletons are temporary, ExplorePetCard list is small.
- **Fix:** Wrap in `memo()` for consistency.

### 4.4 Feed Infinite Scroll -- `handleLikePost`/`handleUnlikePost` Wrappers Are No-Ops
- **File:** `src/pages/FeedPage.tsx` lines 41-47
- **Issue:** `handleLikePost` is `useCallback((postId) => likePost(postId), [likePost])` -- this is a trivial wrapper around `likePost` that adds zero value. It's creating unnecessary function allocation. Should just pass `likePost` directly.
- **Risk:** Negligible
- **Fix:** Remove the wrapper; pass `likePost` and `unlikePost` directly to `PostCard`.

---

## DOMAIN 5: Backend & Database Integrity

### 5.1 `db-triggers` Section Shows "No Triggers" -- Documentation Gap
- **Issue:** The system prompt's `<db-triggers>` section says "There are no triggers in the database," but the codebase relies on 10+ triggers (e.g., `handle_new_user`, `update_post_likes_count`, `notify_on_new_appointment`, `check_pet_limit`). The functions exist in `<db-functions>` but the trigger bindings are not visible in the provided metadata.
- **Risk:** None if triggers are actually active (they likely are since features work). This is a metadata reporting gap.
- **Action:** Verify triggers are attached by running `SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';`

### 5.2 Restrictive RLS Intersection Issue on `clinic_doctors`
- **File:** Database RLS policies on `clinic_doctors`
- **Issue:** Two SELECT policies exist: "Authenticated users can view clinic doctors" (`USING (true)`) and "Public can view active clinic doctor affiliations" (`USING (status = 'active')`). Both are **Restrictive** (Permissive: No). In PostgreSQL, restrictive policies are ANDed together -- meaning BOTH must pass. This means the `true` policy is effectively overridden by the `status = 'active'` policy, making the first policy useless. This is not a bug per se, but if the intent was to show inactive affiliations to authenticated users, it's broken.
- **Risk:** Low -- current behavior (only active affiliations visible) is likely intended.
- **Fix:** If both behaviors are intended, make the broader one Permissive.

### 5.3 `contact_messages` INSERT Policy Allows Unauthenticated Inserts
- **File:** Database RLS on `contact_messages`
- **Issue:** The INSERT policy uses `WITH CHECK (true)` but is scoped to `authenticated` role (as per the policy name "Authenticated users can submit contact messages"). However, the Contact page has a login gate (`if (!user)`). If the RLS policy truly allows any authenticated user, this is fine. But if the intent is to allow public (unauthenticated) contact form submissions, the policy may be blocking them.
- **Risk:** Low -- the Contact page already checks `user` before submitting.

### 5.4 `appointment_waitlist` -- Missing Foreign Keys in Schema
- **File:** Database schema for `appointment_waitlist`
- **Issue:** The `<foreign-keys>` section is empty for this table, meaning `user_id`, `clinic_id`, and `doctor_id` have no FK constraints. Orphaned waitlist entries could persist if a clinic/doctor is deleted.
- **Risk:** Low -- admin clinic/doctor deletions are rare.
- **Fix:** Add FK constraints with `ON DELETE CASCADE`.

### 5.5 Multiple Tables Missing Foreign Keys
- **Issue:** `likes`, `comments`, `follows`, `stories`, `reviews`, `wishlists`, `doctor_favorites`, `clinic_favorites`, `clinic_reviews`, `messages`, `conversations`, `orders`, `incomplete_orders` all show empty `<foreign-keys>` sections. This means no referential integrity at the database level.
- **Risk:** Medium -- orphaned rows accumulate over time as users/pets/products are deleted. Currently, cascade deletes are handled in application code (e.g., `useAdminSocialActions` manually deletes comments + likes when deleting a post), but this is fragile.
- **Fix:** Add FK constraints. This is a significant migration but prevents data corruption long-term.

---

## DOMAIN 6: Realtime & Subscription Integrity

### 6.1 All Realtime Channels Properly Cleaned Up -- VERIFIED
Every `useEffect` that creates a Supabase channel has a corresponding `return () => { supabase.removeChannel(channel); }` cleanup. Verified across 15 files.

### 6.2 Admin Realtime Scoping -- VERIFIED FIXED
The `useAdminRealtimeDashboard` hook correctly splits into 4 scoped channels (`admin-rt-orders`, `admin-rt-clinical`, `admin-rt-social`, `admin-rt-catalog`) with targeted invalidations.

### 6.3 Analytics Channel Is Separate -- VERIFIED
`useAdminAnalytics` has its own dedicated channel (`admin-analytics-realtime`), avoiding cross-contamination.

---

## DOMAIN 7: Performance & Optimization

### 7.1 `PostCard` -- Properly Memoized with Custom Comparator -- VERIFIED
`src/components/social/PostCard.tsx` uses `memo()` with a custom comparator checking `id`, `likes_count`, `comments_count`, and `liked_by_user`.

### 7.2 `DoctorCard`, `ClinicCard`, `ProductCard` -- All Wrapped in `memo()` -- VERIFIED

### 7.3 `contentVisibility: 'auto'` Applied to Feed Posts -- VERIFIED
`FeedPage.tsx` (line 92) and `PostCard.tsx` (line 185) use CSS containment for paint optimization.

### 7.4 `loading="lazy"` Widely Applied -- VERIFIED
Found in 16 files across product images, chat media, blog articles, clinic maps, social media, and order items.

### 7.5 Missing: No `memo()` on Navbar's Inner Components
- **File:** `src/components/Navbar.tsx`
- **Issue:** The Navbar itself is memoized, but `navLinks` is defined outside (good). However, the mobile Sheet re-renders fully on every menu toggle because the link items reconstruct `NavLink` components.
- **Risk:** Negligible -- Navbar is simple enough.

### 7.6 Vendor Chunking -- VERIFIED CORRECT
`vite.config.ts` correctly bundles `react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `react-router-dom`, and `@tanstack/react-query` into a single `vendor-react` chunk, with separate chunks for `date-fns` and `@supabase/supabase-js`.

---

## DOMAIN 8: Edge Function Issues

### 8.1 `geocode` and `parse-product-pdf` -- `verify_jwt = false` in Config
- **File:** `supabase/config.toml`
- **Issue:** Both functions have JWT verification disabled. `geocode` is intentionally public (reverse geocoding), but `parse-product-pdf` accepts arbitrary PDF uploads without authentication. While it doesn't write to the database, it does consume AI API credits.
- **Risk:** Medium -- anyone can call the PDF parser endpoint and drain AI credits.
- **Fix:** Add JWT verification to `parse-product-pdf` or add rate limiting by IP.

### 8.2 `upload-image-url` -- `verify_jwt = false` in Config But Checks JWT in Code
- **File:** `supabase/config.toml` line for `upload-image-url`
- **Issue:** The config disables JWT verification, but the function code manually verifies JWT and checks admin role. This is intentional (manual verification), but the config creates confusion.
- **Risk:** None (security is handled in code).

---

## DOMAIN 9: SEO & PWA

### 9.1 Service Worker Is Minimal
- **File:** `public/sw.js`
- **Issue:** Not audited in detail, but registered in `main.tsx`. If the SW is a no-op or only caches the shell, offline functionality may be limited to just the offline indicator banner.
- **Risk:** Low -- PWA is a nice-to-have.

---

## Prioritized Fix Order

| Priority | Domain | Issue | Risk | Effort |
|----------|--------|-------|------|--------|
| 1 | Type Safety | 3.1: Replace top `as any` hotspots (AdminOrders, ChatPage, WishlistPage) with proper interfaces | Medium | Medium |
| 2 | Routing | 2.3: Add auth guard to social routes (/feed, /messages, /notifications, /chat) | Medium | Low |
| 3 | State | 1.3: Add `useMemo` to PetContext provider value | Medium | Low |
| 4 | Backend | 5.5: Add FK constraints to tables missing referential integrity | Medium | Medium |
| 5 | Security | 8.1: Add JWT verification or rate limiting to `parse-product-pdf` | Medium | Low |
| 6 | UI/UX | 4.1: Migrate CheckoutPage to `react-hook-form` for inline errors | Medium | Medium |
| 7 | State | 1.4: Fix WishlistContext stale closure pattern | Low | Low |
| 8 | Cleanup | 1.1: Remove `console.log` from CartContext | Low | Trivial |
| 9 | Cleanup | 1.5: Add unmount cleanup for AdminSettings blob URLs | Low | Low |
| 10 | UI/UX | 4.2: Add cooldown to ContactPage form | Low | Low |

---

## Issues Verified as Already Fixed

These were flagged in the previous audit (`.lovable/plan.md`) and are confirmed resolved:

- **H1 (Object URL leaks):** All 5 affected files now have `useEffect` cleanup + revocation on file change.
- **H3 (Admin realtime over-subscription):** Split into 4 scoped channels with targeted invalidations.
- **M1 (CartContext memoization):** All callbacks use `useCallback`, value uses `useMemo`.
- **M2 (DoctorCard/ClinicCard memo):** Both wrapped in `memo()` with `forwardRef`.
- **M3 (WishlistContext callbacks):** All wrapped in `useCallback`, value in `useMemo`.
- **M4 (Admin ErrorBoundary isolation):** `RequireAdmin` wraps children in `<ErrorBoundary>`.
- **L1 (Dead category UI in AddServiceWizard):** `selectedCategory` no longer exists in the component.
- **L2 (CreatePostCard removeMedia leak):** `URL.revokeObjectURL(mediaPreviews[index])` is called before filtering.

