
# Admin Customers Page Improvements

## Issues Identified from Screenshot and Code

### 1. Missing Summary Stats Bar
Other admin pages (Orders, Products, Clinics, Doctors) have interactive stat cards at the top showing key metrics. The Customers page has none. Should add stats like: Total Customers, Admins, Moderators, Doctors, Clinic Owners.

### 2. No Pagination
All customers render at once with no pagination or virtual scrolling. With growing user counts this will degrade performance and overwhelm the UI.

### 3. Missing Avatar Display
Every row shows a generic User icon. The `profiles` table has an `avatar_url` column -- should display the actual user avatar when available.

### 4. Truncated User IDs Shown Instead of Useful Info
The secondary text under the customer name shows a raw UUID snippet (e.g., `75561730...`). This is meaningless to admins. Replace with email or phone number.

### 5. No Role Filter
Admin can only search by name/phone. There is no way to filter by role (Admin, Moderator, User, Doctor, Clinic Owner) which is the primary management action on this page.

### 6. Missing "doctor" and "clinic_owner" Role Options
The dropdown only offers User, Moderator, and Admin roles. But the system supports `doctor` and `clinic_owner` roles too -- these should at least be visible in the badge display and the role filter.

### 7. No Total Count Display
The page doesn't show how many customers exist or how many match the current search/filter.

### 8. Query Not Protected
Unlike other admin pages, the `useAdminUsers` query runs without checking `isAdmin` in the component (it does check in the hook, but the component doesn't gate rendering on it properly before the query resolves).

---

## Implementation Plan

### Step 1: Add Customer Stats Bar
Add a row of stat cards above the search bar showing:
- Total Customers
- Admins count
- Moderators count  
- Doctors count
- Clinic Owners count

Compute these from the already-fetched customer data (no extra queries).

### Step 2: Add Role Filter
Add a Select/dropdown filter next to the search bar to filter by role: All, User, Admin, Moderator, Doctor, Clinic Owner.

### Step 3: Show Real Avatars
Use the `Avatar` component with `avatar_url` from profiles. Fall back to the User icon when no avatar exists.

### Step 4: Replace UUID with Useful Secondary Info
Show phone number (or "No phone") as the subtitle instead of truncated user IDs.

### Step 5: Add Result Count + Pagination
- Show "Showing X of Y customers" text
- Add simple pagination (e.g., 20 per page) using the existing `usePagination` hook

### Step 6: Update Role Badge to Support All Roles
Add badges for `doctor` and `clinic_owner` roles with appropriate colors/icons.

### Step 7: Minor UI Polish
- Ensure the "Export CSV" button is always visible (not hidden text on mobile)
- Add hover states on table rows for better interactivity

---

## Technical Details

### Files to Modify
- `src/pages/admin/AdminCustomers.tsx` -- Main page with all the above changes

### Dependencies Used (already installed)
- `@radix-ui/react-avatar` for Avatar
- `@radix-ui/react-select` for role filter
- `lucide-react` icons (Stethoscope, Building2 for doctor/clinic roles)
- `src/hooks/usePagination.ts` for pagination logic

### No Database Changes Required
All data is already available from the existing `useAdminUsers` hook which fetches profiles + user_roles.
