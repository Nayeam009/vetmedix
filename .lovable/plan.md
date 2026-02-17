

# Pre-Launch Punch List -- Gold Master Audit

## Category 1: CLEANUP (Dead Code and Console Hygiene)

### CLN-1: Delete Orphaned `App.css` (Low)
**File:** `src/App.css`

This file contains Vite starter template styles (`.logo`, `.read-the-docs`, `.card`, `#root` with `max-width: 1280px`) that are never imported anywhere. The app uses `index.css` with Tailwind. This is dead weight.

**Action:** Delete `src/App.css`.

---

### CLN-2: Replace Unguarded `console.error` with `logger.error` (Medium)
**Files with bare `console.error()` leaking in production:**

| File | Occurrences | Context |
|---|---|---|
| `src/hooks/useClinicOwner.ts` | 10 | All `onError` callbacks in mutations |
| `src/pages/admin/AdminDoctors.tsx` | 3 | Approve/reject/block `onError` |
| `src/pages/ResetPasswordPage.tsx` | 1 | Password update catch |
| `src/pages/doctor/DoctorVerificationPage.tsx` | 2 | Verification + profile creation catch |
| `src/components/clinic/WriteReviewDialog.tsx` | 1 | Review submit catch |
| `src/pages/ContactPage.tsx` | 1 | Contact form catch |
| `src/pages/TrackOrderPage.tsx` | 2 | Order fetch + tracking catch |

The project already has a `logger` utility (`src/lib/logger.ts`) that silences output in production. These 20 bare `console.error` calls bypass it and leak table names, error codes, and stack traces to end users.

**Action:** In each file, add `import { logger } from '@/lib/logger'` and replace `console.error(...)` with `logger.error(...)`.

---

### CLN-3: `analytics.ts` Uses `console.log` (Low)
**File:** `src/lib/analytics.ts` (lines 46, 210)

Two `console.log` calls are already guarded by `import.meta.env.DEV`, so they won't leak. However, for consistency with the `logger` pattern used everywhere else, they should use `logger.info`.

**Action:** Replace with `logger.info(...)` for pattern consistency.

---

## Category 2: POLISH (Visual and Interaction Consistency)

### POL-1: MessagesPage Missing `MobileNav` (Medium)
**File:** `src/pages/MessagesPage.tsx`

The Messages page renders `<Navbar />` and `<Footer />` but does NOT render `<MobileNav />`. On mobile, there is no bottom navigation bar, forcing users to use the browser back button. Every other page (Profile, Feed, Shop, Clinics) includes `<MobileNav />`.

**Action:** Add `import MobileNav from '@/components/MobileNav'` and render `<MobileNav />` before the closing `</div>`. Also add `pb-20 md:pb-0` to the root div for bottom nav spacing.

---

### POL-2: MessagesPage Empty State Missing CTA Button (Low)
**File:** `src/pages/MessagesPage.tsx` (lines 113-122)

The empty state shows text ("Start chatting by visiting a pet profile...") but has no actionable button. The Orders and Appointments empty states both have branded CTA buttons ("Start Shopping", "Find a Clinic").

**Action:** Add a `<Button onClick={() => navigate('/explore')}>Explore Pets</Button>` to the empty state.

---

### POL-3: MessagesPage Missing `pb-20` for Mobile Bottom Nav (Low)
**File:** `src/pages/MessagesPage.tsx` (line 89)

The root container uses `min-h-screen bg-background` but lacks `pb-20 md:pb-0` which is the standard padding to prevent content from being hidden behind the mobile bottom nav.

**Action:** Add `pb-20 md:pb-0` to root div className after adding MobileNav (part of POL-1).

---

## Category 3: OPTIMIZATION (Performance and Production Readiness)

### OPT-1: Lazy Loading Already Complete (No Action)
All routes in `App.tsx` are lazy-loaded via `React.lazy()`. The `manualChunks` config in `vite.config.ts` splits React, React Query, date-fns, and Supabase into separate chunks. No changes needed.

### OPT-2: iOS Safe Area Already Handled (No Action)
`MobileNav` already uses `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}`. Cart, Checkout, and ClinicDetail sticky bars also apply this. Admin mobile nav uses `pb-[calc(env(safe-area-inset-bottom)+16px)]`. No changes needed.

### OPT-3: Z-Index Stack Already Correct (No Action)
- MobileNav: `z-50`
- Sticky bars (Cart/Checkout): `z-40`
- Sonner toasts: render at `z-[100]` via default positioning (`bottom-right`)
- Dialogs: `z-50` (shadcn default)

No z-index conflicts found.

### OPT-4: Empty States Already Branded (No Action)
Orders, Appointments, Clinic Doctors, Services, Admin tables -- all have icon + heading + description + CTA button empty states. Only MessagesPage is missing the CTA (covered in POL-2).

---

## Summary of Changes

| ID | Category | Severity | File | Action |
|---|---|---|---|---|
| CLN-1 | Cleanup | Low | `App.css` | Delete file (dead Vite template styles) |
| CLN-2 | Cleanup | Medium | 7 files | Replace 20 bare `console.error` with `logger.error` |
| CLN-3 | Cleanup | Low | `analytics.ts` | Replace 2 `console.log` with `logger.info` |
| POL-1 | Polish | Medium | `MessagesPage.tsx` | Add missing `MobileNav` component |
| POL-2 | Polish | Low | `MessagesPage.tsx` | Add CTA button to empty state |

**Total: 9 files modified, 1 file deleted. No database changes. No new dependencies.**

## Technical Details

### CLN-2 Implementation Pattern
For each file, the change is mechanical:

```typescript
// Add at top:
import { logger } from '@/lib/logger';

// Replace each:
console.error(error);
// With:
logger.error(error);
```

Files and line counts:
- `useClinicOwner.ts`: 10 replacements (lines 163, 204, 226, 256, 279, 301, 320, 342, 387, 437)
- `AdminDoctors.tsx`: 3 replacements (lines 142, 181, 221)
- `ResetPasswordPage.tsx`: 1 replacement (line 49)
- `DoctorVerificationPage.tsx`: 2 replacements (lines 134, 170)
- `WriteReviewDialog.tsx`: 1 replacement (line 96)
- `ContactPage.tsx`: 1 replacement (line 49)
- `TrackOrderPage.tsx`: 2 replacements (lines 112, 163)

### POL-1 Implementation (MessagesPage MobileNav)
Add import and render MobileNav, plus bottom padding:

```tsx
// Root div:
<div className="min-h-screen bg-background pb-20 md:pb-0">

// Before closing </div>:
<MobileNav />
```

