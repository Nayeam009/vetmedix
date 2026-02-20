

# Comprehensive Codebase Regression Audit Report

---

## CRITICAL (Priority 0): White Screen Crash Still Active

The runtime errors show `Cannot read properties of null (reading 'useEffect')` originating from `QueryClientProvider`. This is the **same duplicate React instance crash** that has persisted through multiple fix attempts. The `reactSingleton.ts` file was deleted, and `vite.config.ts` was reverted, but the Vite dependency cache (`.vite/deps/`) still holds stale chunks with mismatched version hashes (`v=4112562a` vs `v=033f75de`).

**Root cause**: The `manualChunks` configuration in `vite.config.ts` splits `react` and `react-dom` into a `vendor-react` chunk, but `@tanstack/react-query` is in a separate `vendor-query` chunk. When Vite pre-bundles these independently, they can resolve to different internal React dispatcher instances.

**Fix (Step 1):**
- Add `resolve.dedupe: ['react', 'react-dom']` to `vite.config.ts`
- Move `@tanstack/react-query` into the `vendor-react` manual chunk so React and its consumers share a single bundle boundary
- Add `optimizeDeps.include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@tanstack/react-query']` to force co-bundling during dev

---

## HIGH RISK Findings

### H1: React Hook Rules Violation in AdminSettings.tsx

`createSaveMutation()` (line 240) calls `useMutation()` inside a regular function, not at the top level of the component. React hooks must only be called at the top level. This currently works by accident because the function is called unconditionally during render, but any conditional wrapping or refactor will cause a crash.

**Fix**: Replace the factory pattern with individual `useMutation` calls at the top level, or extract each into a custom hook.

---

### H2: AddServiceWizard -- No Validation, No Error Handling

Unlike the refactored `AddDoctorWizard`, the `AddServiceWizard` component:
- Uses raw `useState` instead of `react-hook-form` + Zod
- Has **no `try/catch`** around the `handleSubmit` call (line 112-119) -- if the parent's `onSubmit` rejects, the error is unhandled and the UI freezes with a spinner
- Has **no input validation** beyond a minimum name length check
- Missing XSS prevention on name/description fields
- No character limits on description field

**Fix**: Refactor to use `react-hook-form` + `zodResolver`, wrap submit in `try/catch` with `toast.error`, add Zod schema with character limits and XSS regex.

---

### H3: ClinicVerificationPage -- No Schema Validation

- Uses raw `useState` with manual field-by-field validation (lines 168-192)
- No character limits on any field (owner name, NID, address, description)
- No input sanitization or XSS prevention
- NID number accepts any string with no format validation
- The `uploading` state is set inside the mutation but the submit button only checks `submitVerification.isPending`, not `uploading` -- a user can double-click before upload completes

**Fix**: Add Zod schema validation, disable submit during `uploading || isPending`, add character limits.

---

### H4: DoctorVerificationPage -- No Schema Validation

- Same pattern as ClinicVerificationPage: raw `useState`, manual checks
- NID number and license number accept arbitrary strings
- No character limits on bio field
- Uses `(doctorProfile as any)` casts in 8+ places, indicating type mismatches with the database schema type
- `window.location.reload()` on line 175 is a brute-force approach that loses all client state

**Fix**: Add Zod schema, replace `any` casts with proper typing, replace `reload()` with query invalidation.

---

### H5: Double Submission Vulnerability on Multiple Forms

Forms that lack dual-state protection (both `disabled` on button AND mutation `isPending` check):

| Form | Has Loading State | Prevents Double Submit |
|---|---|---|
| AddServiceWizard | Yes (isPending prop) | Partial -- no try/catch means spinner sticks on error |
| ClinicVerificationPage | Partial (isPending but not uploading) | No -- can click during upload |
| DoctorVerificationPage | Yes (submitting state) | Yes |
| AdminSettings (each tab) | Yes (mutation.isPending) | Yes |
| AcceptOrderDialog | Yes (isSubmitting) | Yes |

---

## MEDIUM RISK Findings

### M1: Missing `React.memo` on High-Frequency Components

Search confirms **zero** usage of `React.memo()` export pattern in the codebase. Only `PostCard` uses `memo()` internally. Components that would benefit from memoization:

- `DoctorCard` -- rendered in lists, receives stable props
- `ClinicCard` -- rendered in lists
- `ProductCard` -- rendered in shop grid, re-renders on parent filter changes
- `AdminStatCard` / `StatCard` -- re-render on any dashboard state change
- `OrderCard` / `AppointmentCard` in profile page

**Fix**: Wrap list-item components in `memo()`.

---

### M2: Missing Debounce on Search/Filter Inputs

Only `GlobalSearch` and `CMSArticlesTab` use `useDebounce`. Other pages with search/filter that fire queries on every keystroke:

- `AdminOrders` (order search)
- `AdminProducts` (product search)
- `AdminCustomers` (customer search)
- `DoctorsPage` (doctor search)
- `ShopPage` (product search)

**Fix**: Apply `useDebounce(query, 300)` to all search inputs that trigger database queries.

---

### M3: No `useMemo` on Expensive Computed Values

The `AdminSettings` page rebuilds all 5 mutation objects on every render via `createSaveMutation`. The `AnalyticsExport` component rebuilds CSV data on every render. Dashboard stats components recompute derived values without memoization.

**Fix**: Wrap expensive computations in `useMemo` and callback-heavy handlers in `useCallback`.

---

### M4: Inconsistent Error Handling Patterns

The codebase uses two different toast systems simultaneously:
- `sonner` (via `import { toast } from 'sonner'`)
- `shadcn/ui toast` (via `import { useToast } from '@/hooks/use-toast'`)

`AcceptOrderDialog` uses the shadcn `useToast` hook, while most other components use `sonner`. This creates visual inconsistency (different toast positions, styles, durations).

**Fix**: Standardize on `sonner` across all components (it's already the dominant pattern).

---

## LOW RISK Findings

### L1: Dead/Redundant Code

- `src/components/ui/use-toast.ts` is a re-export wrapper that adds no value
- The `category` field in `AddServiceWizard`'s `ServiceFormData` is collected but **never sent** to the database (it's excluded from the `handleSubmit` call on line 113)

### L2: Missing Loading Skeletons

Several pages show only a spinner (`Loader2`) instead of content-aware skeleton loaders:
- ClinicVerificationPage
- DoctorVerificationPage
- AdminSettings (shows nothing while settings load)

### L3: Mobile Touch Target Compliance

Most refactored components already use `min-h-[44px]`, but the following still have undersized targets:
- `AddServiceWizard` category buttons (only `py-2.5`, approx 38px)
- `AdminSettings` tab triggers on mobile (fixed with `min-h-[44px]` already)
- Duration preset badges in AddServiceWizard (no min-height set)

---

## Recommended Fix Order (Atomic Steps)

1. **Fix white screen crash** -- Add `resolve.dedupe` and merge `@tanstack/react-query` into the React manual chunk in `vite.config.ts`
2. **Fix AdminSettings hook violation** -- Replace `createSaveMutation` factory with top-level `useMutation` calls
3. **Refactor AddServiceWizard** -- Add `react-hook-form` + Zod, `try/catch`, character limits, XSS prevention
4. **Add Zod schema to ClinicVerificationPage** -- Input validation, double-submit protection
5. **Add Zod schema to DoctorVerificationPage** -- Input validation, remove `any` casts
6. **Standardize toast system** -- Replace all `useToast` usages with `sonner`
7. **Add debounce to admin search inputs** -- AdminOrders, AdminProducts, AdminCustomers
8. **Add `React.memo` to list-item components** -- DoctorCard, ClinicCard, ProductCard
9. **Clean up dead code** -- Remove unused `category` field from AddServiceWizard, remove `use-toast.ts` wrapper
10. **Add skeleton loaders** -- Replace spinners with content-aware skeletons on verification pages

