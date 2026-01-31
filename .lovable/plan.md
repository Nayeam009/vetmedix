
# VetMedix Complete Audit - Remaining Issues & Fixes

## Audit Summary

After thoroughly auditing the entire VetMedix webapp across all user roles (Pet Parent, Clinic Owner, Doctor, Admin), I've identified the following remaining issues that need to be fixed:

---

## Category 1: Missing Document Titles (SEO)

Several pages are missing the `useDocumentTitle` hook for SEO optimization:

| Page | Current State | Required Action |
|------|---------------|-----------------|
| `NotificationsPage.tsx` | Missing | Add `useDocumentTitle('Notifications')` |
| `ExplorePage.tsx` | Missing | Add `useDocumentTitle('Explore Pets')` |
| `PetProfilePage.tsx` | Missing | Add dynamic title: `useDocumentTitle(pet?.name + "'s Profile" \|\| 'Pet Profile')` |
| `CreatePetPage.tsx` | Missing | Add `useDocumentTitle('Add New Pet')` |
| `EditPetPage.tsx` | Missing | Add `useDocumentTitle('Edit Pet Profile')` |
| `BookAppointmentPage.tsx` | Missing | Add `useDocumentTitle('Book Appointment')` |
| `ProductDetailPage.tsx` | Missing | Add dynamic title: `useDocumentTitle(product?.name \|\| 'Product Details')` |
| `ClinicDetailPage.tsx` | Missing | Add dynamic title: `useDocumentTitle(clinic?.name \|\| 'Clinic Details')` |
| `TrackOrderPage.tsx` | Missing | Add `useDocumentTitle('Track Order')` |
| `SelectRolePage.tsx` | Missing | Add `useDocumentTitle('Complete Your Profile')` |

**Files to modify:** 10 page files

---

## Category 2: Inconsistent Document Title Implementation

Some pages use `document.title` directly in useEffect instead of the `useDocumentTitle` hook:

| Page | Current Implementation | Fix |
|------|------------------------|-----|
| `AboutPage.tsx` | `document.title = 'About Us - VetMedix'` | Replace with `useDocumentTitle('About Us')` |
| `ContactPage.tsx` | `document.title = 'Contact Us - VetMedix'` | Replace with `useDocumentTitle('Contact Us')` |
| `ForgotPasswordPage.tsx` | `document.title = 'Forgot Password - VetMedix'` | Replace with `useDocumentTitle('Forgot Password')` |
| `ResetPasswordPage.tsx` | `document.title = 'Reset Password - VetMedix'` | Replace with `useDocumentTitle('Reset Password')` |
| `AdminDoctors.tsx` | `document.title = 'Doctor Management...'` | Replace with `useDocumentTitle('Doctor Management - Admin')` |

**Files to modify:** 5 page files

---

## Category 3: Missing Mobile Navigation for Admin

The `AdminMobileNav.tsx` was updated to include Doctors link, but let me verify all navigation is consistent:

**Verification needed:**
- Ensure AdminMobileNav has Doctors link with badge (confirmed earlier it was added)
- Ensure AdminSidebar badges are consistent

---

## Category 4: Footer Social Media Links

**Issue:** Footer social media links (Facebook, Instagram, YouTube) have placeholder `href="#"` attributes.

**Fix:** Either:
1. Connect to actual VetMedix social media accounts
2. Remove the links if no social accounts exist
3. Add `aria-disabled` and prevent navigation

**File:** `src/components/Footer.tsx` (lines 19-39)

---

## Category 5: Contact Page Form Not Functional

**Issue:** The contact form in `ContactPage.tsx` only simulates submission with a timeout - it doesn't actually send the message anywhere.

**Fix Options:**
1. Create an edge function to handle contact form submissions
2. Store submissions in a `contact_messages` database table
3. Send email notifications to admins

**File:** `src/pages/ContactPage.tsx` (lines 27-39)

---

## Category 6: Product Wishlist Not Persisted

**Issue:** In `ProductDetailPage.tsx`, the wishlist functionality (`isWishlisted` state) is only stored in local component state and resets on page refresh.

**Fix:**
1. Create a `wishlists` table in database
2. Implement RLS policies for user-specific wishlists
3. Create `useWishlist` hook to persist wishlist items

**File:** `src/pages/ProductDetailPage.tsx` (lines 39, 209-215)

---

## Category 7: Missing Feed Page Route in Navigation

**Observation:** The Feed page is accessible but the main CTA "GO TO FEED" button is only shown when user is logged in with pets. This is correct behavior.

---

## Implementation Plan

### Phase 1: SEO Document Titles (Priority: High)
Add/fix document titles in 15 pages for consistent SEO

### Phase 2: Contact Form Functionality (Priority: Medium)
Create edge function and database table for contact submissions

### Phase 3: Wishlist Persistence (Priority: Low)
Implement database-backed wishlist feature

### Phase 4: Footer Social Links (Priority: Low)
Update placeholder links or add proper social media URLs

---

## Technical Implementation Details

### Phase 1: Document Title Fixes

**Pattern to use:**
```typescript
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const SomePage = () => {
  useDocumentTitle('Page Title'); // Hook handles " - VetMedix" suffix
  // ... rest of component
};
```

**For dynamic titles:**
```typescript
const PetProfilePage = () => {
  const [pet, setPet] = useState<Pet | null>(null);
  useDocumentTitle(pet?.name ? `${pet.name}'s Profile` : 'Pet Profile');
  // ... rest of component
};
```

### Phase 2: Contact Form Backend

**Database migration:**
```sql
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only admins can read messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact messages"
ON contact_messages FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit contact messages"
ON contact_messages FOR INSERT
WITH CHECK (true);
```

### Phase 3: Wishlist Table

**Database migration:**
```sql
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlists"
ON wishlists FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Files to Modify

### SEO Fixes (15 files):
1. `src/pages/NotificationsPage.tsx`
2. `src/pages/ExplorePage.tsx`
3. `src/pages/PetProfilePage.tsx`
4. `src/pages/CreatePetPage.tsx`
5. `src/pages/EditPetPage.tsx`
6. `src/pages/BookAppointmentPage.tsx`
7. `src/pages/ProductDetailPage.tsx`
8. `src/pages/ClinicDetailPage.tsx`
9. `src/pages/TrackOrderPage.tsx`
10. `src/pages/SelectRolePage.tsx`
11. `src/pages/AboutPage.tsx` (refactor)
12. `src/pages/ContactPage.tsx` (refactor)
13. `src/pages/ForgotPasswordPage.tsx` (refactor)
14. `src/pages/ResetPasswordPage.tsx` (refactor)
15. `src/pages/admin/AdminDoctors.tsx` (refactor)

### Contact Form (2 files):
1. `src/pages/ContactPage.tsx`
2. Database migration (new table)

### Footer (1 file):
1. `src/components/Footer.tsx`

---

## Summary

The VetMedix webapp is largely complete and functional. The main remaining issues are:

1. **SEO consistency** - 15 pages need document title fixes (critical for SEO)
2. **Contact form** - Currently non-functional (medium priority)
3. **Wishlist persistence** - Nice-to-have feature enhancement
4. **Footer social links** - Minor cosmetic issue

All core functionality (authentication, appointments, orders, social features, admin/clinic/doctor management) is working correctly based on my audit.
