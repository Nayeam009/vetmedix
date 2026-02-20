

# Comprehensive Codebase Regression Audit Report

## Executive Summary

The codebase is architecturally sound with good patterns already in place (lazy loading, React Query caching, centralized realtime subscriptions, ErrorBoundary, and Zod validation on key forms). The previous audit (documented in `.lovable/plan.md`) addressed many critical issues. This follow-up audit identifies remaining vulnerabilities across performance, memory, type safety, and edge cases.

---

## HIGH RISK Findings

### H1: Memory Leak -- Object URLs Never Revoked in Multiple Components

**Meaning:** `URL.createObjectURL()` allocates browser memory that persists until explicitly released with `URL.revokeObjectURL()`. Several components create object URLs but never clean them up, causing progressive memory leaks during a session.

**Affected Files:**
- `CreatePostCard.tsx` (lines 195, 202) -- creates previews for up to 4 media files without revoking on unmount or when files change
- `AdminSettings.tsx` (lines 313, 316) -- logo/favicon previews never revoked
- `EditPetPage.tsx` (lines 122, 135) -- avatar/cover previews never revoked
- `CreatePetPage.tsx` (line 58) -- avatar preview never revoked
- `ProfileHeader.tsx` (lines 81, 140) -- avatar/cover previews never revoked

**Solution:** Add `useEffect` cleanup functions that call `URL.revokeObjectURL()` on the previous preview URL whenever a new file is selected, and on component unmount. For `CreatePostCard`, revoke all previews in the `removeMedia` function and on unmount.

---

### H2: Widespread `as any` Type Casts -- 300+ Instances Across 18 Files

**Meaning:** Using `as any` bypasses TypeScript's type checking, hiding potential runtime errors. The most dangerous patterns are in data-fetching hooks and admin components where database response shapes are assumed rather than validated.

**Worst Offenders:**
- `ClinicDoctors.tsx` -- 6+ casts on `cd.doctor as any` for accessing nested join fields (qualifications, consultation_fee)
- `CMSSocialTab.tsx` -- casts on `post.pet as any` for avatar/name access
- `CMSMarketplaceTab.tsx` -- casts on product badge and update payloads
- `useAdminRealtimeDashboard.ts` -- casts on realtime payload.new
- `ProfilePage.tsx` -- casts appointment data

**Solution:** Define proper TypeScript interfaces for joined query results (e.g., `ClinicDoctorWithDetails`, `PostWithPet`). For realtime payloads, create typed helper functions that validate the shape before use.

---

### H3: Realtime Channel Over-subscription in Admin Panel

**Meaning:** `useAdminRealtimeDashboard` subscribes to 13 tables on a single channel. Each admin page also has `AdminLayout` which fetches `admin-pending-counts` every 30 seconds via polling. When combined, every single database change across any of 13 tables triggers `invalidateAll()` which invalidates 3 query keys (`admin-stats`, `admin-pending-counts`, `admin-analytics`), potentially causing cascade re-fetches on unrelated pages.

**Solution:**
- Split the monolithic channel into logical groups (orders, clinical, social, content) so invalidations are scoped
- Remove the 30-second polling in `AdminLayout` since realtime already handles pending count updates
- Use more targeted invalidations -- e.g., a product change should not invalidate `admin-pending-counts`

---

## MEDIUM RISK Findings

### M1: CartProvider Context Value Recreated Every Render

**Meaning:** The `CartProvider` passes an object literal `{ items, addItem, removeItem, ... }` as the context value. Since `addItem`, `removeItem`, `updateQuantity`, and `clearCart` are regular functions (not wrapped in `useCallback`), a new reference is created on every render, causing all cart consumers to re-render even when nothing changed.

**Solution:** Wrap `addItem`, `removeItem`, `updateQuantity`, and `clearCart` in `useCallback`. Then wrap the entire context value object in `useMemo` depending on `items`, `totalItems`, `totalAmount`, and the memoized callbacks.

---

### M2: DoctorCard and ClinicCard Missing `memo` (Contradicts Previous Audit)

**Meaning:** The previous audit claimed these were wrapped in `React.memo`, but a search for `React.memo` returns zero results. A search for the bare `memo` import confirms `ProductCard`, `Navbar`, `FeaturedProducts`, `ExplorePetCard`, `AppointmentCard`, and various admin components use `memo()`, but `DoctorCard.tsx` and `ClinicCard.tsx` are NOT in the list.

**Solution:** Wrap `DoctorCard` and `ClinicCard` exports in `memo()` since they are rendered in filterable lists on `/doctors` and `/clinics` pages.

---

### M3: WishlistContext Likely Has Same Callback Issue as CartContext

**Meaning:** Based on the pattern observed in `CartContext`, `WishlistContext` likely has the same issue of unstable function references causing unnecessary re-renders in consumers.

**Solution:** Audit `WishlistContext.tsx` and apply `useCallback` to all action functions, then `useMemo` on the provider value.

---

### M4: Missing Error Boundary Isolation for Admin Routes

**Meaning:** There is only ONE `ErrorBoundary` wrapping ALL routes. If an admin page crashes (e.g., due to a bad data shape from a realtime payload), the entire app shows the error UI, including for non-admin users on public routes.

**Solution:** Add a secondary `ErrorBoundary` inside the admin route group (`RequireAdmin` wrapper) so admin crashes are isolated from the rest of the app.

---

### M5: `queryClient` Defined Outside Component -- Survives Hot Module Reload

**Meaning:** `const queryClient = new QueryClient(...)` on line 86 of `App.tsx` is defined at module scope. During Vite HMR, the module re-executes, creating a new `QueryClient` instance and losing all cached data. This causes a flash of loading states after every code change in development.

**Solution:** This is a dev-only concern and acceptable for production. No action needed unless dev experience is a priority, in which case wrap in a `useRef` or use a module-level singleton guard.

---

## LOW RISK Findings

### L1: `selectedCategory` in AddServiceWizard Is Collected but Never Submitted

**Meaning:** The user selects a service category (line 55), it's displayed in the summary preview (line 310), but the `handleFormSubmit` function (line 83-98) never includes `selectedCategory` in the data passed to `onSubmit`. This is a dead feature -- the category selection UI exists but has no effect.

**Solution:** Either add `category` to the submit payload and database schema, or remove the category selection UI to avoid confusing users.

---

### L2: `CreatePostCard` Does Not Revoke Old Previews When New Files Are Selected

**Meaning:** When a user selects new media files, `removeMedia` (line 210-216) filters out the old preview URLs but never calls `URL.revokeObjectURL()` on them. Over multiple file selections, this accumulates leaked blob URLs in memory.

**Solution:** Call `URL.revokeObjectURL(mediaPreviews[index])` in `removeMedia` before filtering.

---

### L3: No Rate Limiting on Client-Side Form Submissions

**Meaning:** While some edge functions have rate limiting (e.g., steadfast), client-side forms like contact, appointment booking, and review submission have no throttling. A malicious user could spam submissions rapidly.

**Solution:** Add a simple cooldown mechanism (e.g., disable the submit button for 3 seconds after submission) or implement server-side rate limiting via RLS or edge functions.

---

### L4: `ScrollToTop` Fires `useFocusManagement` Hook on Every Route Change

**Meaning:** The `ScrollToTop` component uses `useFocusManagement()` which likely adds/removes event listeners on every pathname change. This is low risk but could cause unnecessary work.

**Solution:** Verify `useFocusManagement` is using stable effect dependencies.

---

## Recommended Fix Order

| Step | Finding | Risk | Effort |
|------|---------|------|--------|
| 1 | H1: Revoke object URLs in all affected components | High | Low |
| 2 | H3: Split admin realtime channel, remove redundant polling | High | Medium |
| 3 | M1: Memoize CartProvider callbacks and context value | Medium | Low |
| 4 | M2: Wrap DoctorCard and ClinicCard in memo() | Medium | Low |
| 5 | H2: Replace top 5 worst `as any` files with proper types | High | Medium |
| 6 | M3: Memoize WishlistContext callbacks | Medium | Low |
| 7 | L1: Remove dead category UI from AddServiceWizard | Low | Low |
| 8 | L2: Revoke blob URLs in CreatePostCard removeMedia | Low | Low |
| 9 | M4: Add isolated ErrorBoundary for admin routes | Medium | Low |
| 10 | L3: Add client-side submission cooldowns | Low | Low |

