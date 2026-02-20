

# Diagnostic Audit: Admin Panel Forms

## Finding 1: The "Add Doctor" Form Issue

The "Add Doctor" form itself is technically correct in its data flow and submission logic. The reason it appears to "not submit" is the **white screen crash** caused by the duplicate React instance problem (`Cannot read properties of null (reading 'useState')`). When the app crashes with a white screen, no form on any page can function — the entire React tree is destroyed.

In simple terms: The form code is fine, but the app itself crashes before or during rendering due to a low-level infrastructure bug where two copies of React fight over internal state. This is the same `useState` null error visible in the error logs.

### Secondary Issue: Zod Schema Mismatch

The `doctorFormSchema` in `src/lib/validations.ts` is missing the `qualifications` and `avatar_url` fields that the `AddDoctorWizard` component sends. While Zod's `safeParse` silently ignores unknown keys (so it won't block submission), this means:
- No validation is applied to `qualifications` or `avatar_url`
- If the schema were changed to `strict()` mode in the future, the form would break silently

## Finding 2: Data Flow Analysis

The submission chain works as follows:

1. `AddDoctorWizard.handleSubmit()` validates via `doctorFormSchema.safeParse(formData)`
2. On success, calls `onSubmit()` prop which maps to `addDoctor.mutateAsync()` in `useClinicOwner`
3. The hook inserts into `doctors` table with `created_by_clinic_id` set
4. RLS policy allows this for authenticated clinic owners
5. A trigger (`auto_link_clinic_doctor`) auto-links the doctor to the clinic

This chain is correct. Error handling exists (`onError` shows toast). RLS policies are properly configured for clinic owners inserting doctors.

## Finding 3: Two Different "Add Doctor" Forms Exist

There are actually **two completely separate** Add Doctor form implementations:

| Location | Component | Used By |
|---|---|---|
| `src/components/clinic/AddDoctorWizard.tsx` | Multi-step wizard with photo upload, Zod validation | Clinic Owner Dashboard |
| `src/components/clinic/DoctorFormWizard.tsx` | Simpler 3-step wizard, no photo upload | Potentially unused or used elsewhere |

The `DoctorFormWizard.tsx` has a different interface (`qualifications` as comma-separated string vs array) which could cause confusion if used in the wrong context.

## Finding 4: Admin Panel Does NOT Have "Add Doctor"

The `AdminDoctors.tsx` page is purely for **reviewing and managing** existing doctors (approve, reject, block). It has no "Add Doctor" functionality. Only clinic owners can add doctors via the Clinic Dashboard.

## Plan to Fix

### Step 1: Fix the White Screen Crash (Priority 1 - Critical)
Revert the `vite.config.ts` and `src/lib/reactSingleton.ts` to the last known working version before any React deduplication changes were introduced. This is the root cause preventing ALL forms from working.

### Step 2: Update Zod Schema (Priority 2 - Medium)
Add `qualifications` and `avatar_url` fields to `doctorFormSchema` in `src/lib/validations.ts`:

```text
qualifications: z.array(z.string()).optional()  // or string for comma-separated
avatar_url: z.string().url().optional().or(z.literal(''))
```

### Step 3: Consolidate Duplicate Doctor Forms (Priority 3 - Low)
Remove `DoctorFormWizard.tsx` if unused, or consolidate both wizard components into one shared component to prevent drift.

## Global Form Inventory (Other Forms Needing Audit)

| Form | Location | Validation | Status |
|---|---|---|---|
| Add/Edit Product | `AdminProducts.tsx` | `productFormSchema` (Zod) | Has validation |
| Contact Form | `ContactPage.tsx` | `contactSchema` (Zod) | Has validation |
| Checkout | `CheckoutPage.tsx` | `checkoutSchema` (Zod) | Has validation |
| Login/Signup | `AuthPage.tsx` | `loginSchema`/`signupSchema` (Zod) | Has validation |
| Add Service (Clinic) | `AddServiceWizard.tsx` | Needs audit | Unknown |
| Clinic Verification | `ClinicVerificationPage.tsx` | Needs audit | Unknown |
| Doctor Verification | `DoctorVerificationPage.tsx` | Needs audit | Unknown |
| Write Review | `WriteReviewDialog.tsx` | `reviewSchema` (Zod) | Has validation |
| Admin Settings | `AdminSettings.tsx` | Needs audit | Unknown |
| Book Appointment | `BookAppointmentWizard.tsx` | `appointmentSchema` (Zod) | Has validation |
| Edit Profile | `ProfilePage.tsx` | `profileSchema` (Zod) | Has validation |

### Standardization Plan for Remaining Forms
1. Ensure every form uses Zod validation with the schemas in `src/lib/validations.ts`
2. Ensure all forms use responsive Tailwind classes (no hardcoded widths)
3. Add consistent error toast feedback on all mutation failures
4. Ensure mobile-first layouts with `grid-cols-1 sm:grid-cols-2` patterns

