

# Form Health Report -- Vetmedix

## 1. VALIDATION GAPS (Forms allowing empty or bad data)

### VAL-1: Auth Page Uses Manual Zod Parsing Instead of zodResolver (Low)
**File:** `src/pages/AuthPage.tsx`

The auth form uses `useState` for every field and manually calls `loginSchema.parse()` / `signupSchema.parse()` inside a `validateForm()` function. While this works, it does not use `react-hook-form` + `zodResolver` -- the standard pattern recommended for all forms. The validation is correct and catches invalid emails / weak passwords before the API call. The submit button correctly disables and shows a Loader2 spinner during submission.

**Verdict:** Functionally correct. No immediate fix needed. A refactor to `react-hook-form` would standardize it but is low priority.

---

### VAL-2: Contact Form Has No Zod Validation (Medium)
**File:** `src/pages/ContactPage.tsx` (lines 31-37)

The contact form validates with basic `if (!formData.name || !formData.email || !formData.message)` -- no Zod schema, no max-length enforcement in JavaScript (only `maxLength` attribute on some inputs, but `name` and `email` fields lack it), no email format validation beyond `type="email"`.

**Fix:** Create a `contactSchema` in `src/lib/validations.ts` and validate with `safeParse()` before submission. Add `maxLength` attributes to name (100) and email (255) inputs.

---

### VAL-3: AddDoctorWizard Has No Zod Validation (Medium)
**File:** `src/components/clinic/AddDoctorWizard.tsx`

The wizard only checks `formData.name.trim().length >= 2` for step 0. There is no Zod schema applied. Fields like email, phone, experience_years, and consultation_fee have no format or range validation. A clinic owner could enter "abc" as an email or "-5" as experience years.

**Fix:** Create a `doctorFormSchema` in `src/lib/validations.ts` and validate before final submission (step 3 "Add Doctor" click).

---

### VAL-4: BookAppointmentWizard Has No Zod Validation (Low-Medium)
**File:** `src/components/booking/BookAppointmentWizard.tsx`

The wizard uses manual `canProceed()` checks per step. An `appointmentSchema` already exists in `src/lib/validations.ts` but is not imported or used here. The wizard duplicates the validation logic manually.

**Fix:** Import and use `appointmentSchema.safeParse()` before the final `handleSubmit`.

---

### VAL-5: Product Review Form Has No Max-Length Validation in JS (Low)
**File:** `src/components/ProductReviewForm.tsx` (line 91)

The comment textarea has `maxLength={500}` as an HTML attribute but no Zod schema. The `reviewSchema` exists in `src/lib/validations.ts` but is not imported or used.

**Fix:** Import `reviewSchema` and validate before submission.

---

## 2. UX FAILURES (Buttons not disabling, missing feedback)

### UX-1: Auth Error Messages Are Generic (Medium)
**File:** `src/pages/AuthPage.tsx` (lines 316-323)

When sign-up fails with "User already registered", the error is caught generically and displayed as whatever Supabase returns. The toast shows `error.message` directly, which may be technical (e.g., "User already registered"). While functional, a friendlier mapping (like the one in `ForgotPasswordPage.tsx`) would improve UX.

**Fix:** Add a `friendlyMessages` map similar to `ForgotPasswordPage.tsx` for common auth errors like "User already registered" and "Invalid login credentials".

---

### UX-2: Checkout Phone Input Missing `type="tel"` (Low)
**File:** `src/pages/CheckoutPage.tsx` (line 486-494)

The phone input field does not have `type="tel"`. It uses default `type` (text). On mobile, this means the numeric keypad is not triggered automatically.

**Fix:** Add `type="tel"` to the phone input.

---

### UX-3: Delete Product Has No Typed Confirmation (Low)
**File:** `src/pages/admin/AdminProducts.tsx` (lines 249-263)

Product deletion uses a simple "Delete" button in a confirmation dialog. There is no requirement to type "DELETE" or the product name. While acceptable for products, this should be noted. Clinic deletion in the admin panel should be checked for similar behavior.

**Verdict:** Acceptable for products (non-destructive in the sense that products can be re-added). For clinics or user accounts, a typed confirmation would be advisable. No immediate fix needed for products.

---

### UX-4: Checkout Form Retains Data on Payment Failure (Good)
**File:** `src/pages/CheckoutPage.tsx` (lines 295-303)

When the order fails (catch block), the form data is NOT cleared -- only `setLoading(false)` is called. The user's shipping details, coupon, and payment method are all preserved. This is correct behavior.

**Verdict:** No fix needed. Good UX.

---

## 3. LOGIC BUGS (Edit forms, race conditions)

### BUG-1: Appointment Wizard Does Not Re-Validate Slot Availability at Submit Time (Medium)
**File:** `src/components/booking/BookAppointmentWizard.tsx` (lines 215-217)

The wizard fetches booked slots when the date/doctor changes (line 79-96), filtering them from the display. However, when the user clicks "Confirm Booking" on the final step, there is no re-check of slot availability. If another user books the same slot between the time this user selected it and clicked confirm, a race condition occurs.

The actual booking goes through `book_appointment_atomic()` which has a unique index that rejects duplicates with a clear error message ("This time slot is already booked"). So the race condition is handled at the DB level, but the error surfaces as a generic toast rather than a step-back to the date/time selector.

**Fix:** In the `onSubmit` callback (parent component), catch the "already booked" error and show a specific toast prompting the user to select a different time, rather than a generic failure.

---

### BUG-2: Product Edit Form Pre-fills Correctly (Good)
**File:** `src/pages/admin/AdminProducts.tsx` (lines 309-327)

The `openEditDialog` function correctly maps all product fields (including category, is_active, is_featured, discount, compare_price, sku) to the form state. The Select component for category uses `value={formData.category}` which correctly pre-fills.

**Verdict:** No bug. Pre-fill works correctly including Select/Dropdown components.

---

### BUG-3: WriteReviewDialog Initial State Bug on Re-Open (Low)
**File:** `src/components/clinic/WriteReviewDialog.tsx` (lines 41-43)

When the dialog is opened with an existing review for editing, `useState(existingReview?.rating || 0)` is used. However, `useState` only uses the initial value on first render. If the user opens the dialog, closes it, and the `existingReview` prop changes (e.g., they edited it elsewhere), the state won't update. This is mitigated because the component is re-mounted when `open` changes in most cases.

**Verdict:** Minor. The dialog likely unmounts on close, so the initial state is recalculated. No immediate fix needed but worth noting.

---

## 4. MOBILE INPUT TYPE AUDIT

| Form | Field | Current `type` | Correct `type` | Status |
|---|---|---|---|---|
| Auth (Login/Signup) | Email | `email` | `email` | OK |
| Auth (Login/Signup) | Password | `password` | `password` | OK |
| Checkout | Phone | (none/text) | `tel` | **NEEDS FIX** |
| Checkout | Full Name | (none/text) | `text` | OK |
| AddDoctorWizard | Phone | `tel` | `tel` | OK |
| AddDoctorWizard | Email | `email` | `email` | OK |
| Contact | Email | `email` | `email` | OK |
| ForgotPassword | Email | `email` | `email` | OK |

---

## SUMMARY MATRIX

| ID | Severity | Category | Issue |
|---|---|---|---|
| VAL-2 | Medium | Validation | Contact form has no Zod validation |
| VAL-3 | Medium | Validation | AddDoctorWizard has no Zod validation |
| UX-1 | Medium | UX | Auth error messages are generic |
| BUG-1 | Medium | Logic | Appointment booking race condition error handling |
| VAL-4 | Low-Medium | Validation | BookAppointmentWizard ignores existing appointmentSchema |
| VAL-5 | Low | Validation | ProductReviewForm ignores existing reviewSchema |
| UX-2 | Low | UX/Mobile | Checkout phone missing type="tel" |
| VAL-1 | Low | Code Quality | Auth form uses manual parsing instead of zodResolver |
| UX-3 | Low | UX | Product delete has no typed confirmation |

## RECOMMENDED FIX PRIORITY

1. **VAL-2 + VAL-3** -- Add Zod schemas and validation to Contact form and AddDoctorWizard (prevents bad data entry)
2. **UX-1** -- Add friendly error message mapping to AuthPage for common auth errors
3. **BUG-1** -- Improve appointment booking error handling for race condition ("slot already booked" should prompt re-selection)
4. **VAL-4 + VAL-5** -- Wire existing Zod schemas (appointmentSchema, reviewSchema) into their respective forms
5. **UX-2** -- Add `type="tel"` to checkout phone input

**Total: 5 files to modify, 1 new schema to add to validations.ts. No database changes. No new dependencies.**

