
# Deep System Audit: Fix and Polish Plan

## Audit Summary

After a thorough review of all admin routes, components, hooks, sidebar navigation, realtime subscriptions, and database connections, the following issues were identified.

---

## 1. CRITICAL -- Broken Logic and Disconnected Database Calls

### 1.1 Broken Navigation: Realtime Contact Message Toast
- **File:** `src/hooks/useAdminRealtimeDashboard.ts` (line 84)
- **Issue:** The toast action navigates to `/admin/contact-messages`, but the actual route registered in `App.tsx` is `/admin/messages`. Clicking "View" on the toast navigates to a 404 page.
- **Fix:** Change `navigate('/admin/contact-messages')` to `navigate('/admin/messages')`.

### 1.2 Sidebar Label Mismatch (Mobile vs Desktop)
- **File:** `src/components/admin/AdminMobileNav.tsx` (line 72)
- **Issue:** The mobile nav label reads "Content / CMS" while the desktop sidebar (`AdminSidebar.tsx` line 72) reads "Content Hub". These should match for consistency.
- **Fix:** Update the mobile nav label from "Content / CMS" to "Content Hub".

### 1.3 AdminSettings Uses Manual Auth Guard Instead of RequireAdmin
- **File:** `src/pages/admin/AdminSettings.tsx` (lines 215-268)
- **Issue:** This page manually checks auth/admin state with `useEffect` redirects and renders its own "Access Denied" UI, duplicating the exact logic already centralized in `RequireAdmin`. Every other admin page uses `RequireAdmin`.
- **Fix:** Wrap the component in `<RequireAdmin>` and remove the ~50 lines of manual guard code. This also means the Settings page will properly show the admin layout during loading instead of a raw spinner.

### 1.4 CMS Editor Preview Shows Raw HTML Instead of Rendered Markdown
- **File:** `src/pages/admin/AdminCMSEditor.tsx` (line 206)
- **Issue:** The content field is labeled "Markdown supported" but the preview mode uses `dangerouslySetInnerHTML` with the raw content value. If users type Markdown, it will display as raw text, not rendered HTML. There is no Markdown-to-HTML conversion step.
- **Fix:** Add a simple Markdown-to-HTML converter (lightweight regex-based or a tiny library like `marked`) to transform content before preview. Alternatively, clarify that content must be written as HTML.

### 1.5 Admin Social Post Delete Lacks RLS Bypass for Admin
- **File:** `src/hooks/useAdminSocialActions.ts` (line 12)
- **Issue:** The `useDeletePost` mutation deletes from `comments`, `likes`, and `posts` tables. The RLS policies on these tables only allow the **owner** (`auth.uid() = user_id`) to delete. An admin deleting another user's post will silently fail (no rows deleted) because there is no admin DELETE policy on `posts`, `comments`, or `likes`.
- **Fix:** Add RLS policies allowing admins to delete from `posts`, `comments`, and `likes`:
  ```sql
  CREATE POLICY "Admins can delete posts" ON posts FOR DELETE USING (has_role(auth.uid(), 'admin'));
  CREATE POLICY "Admins can delete comments" ON comments FOR DELETE USING (has_role(auth.uid(), 'admin'));
  CREATE POLICY "Admins can delete likes" ON likes FOR DELETE USING (has_role(auth.uid(), 'admin'));
  ```
  Without these, the CMSSocialTab delete button and AdminSocial moderation are non-functional for admin.

### 1.6 Admin Pet Delete Also Lacks RLS
- **File:** `src/hooks/useAdminSocialActions.ts` (line 30)
- **Issue:** Same problem -- `useDeletePet` deletes from `pets`, `posts`, `stories`, `follows` but there are no admin DELETE policies on `pets`, `stories`, or `follows`.
- **Fix:** Add admin DELETE policies on `pets`, `stories`, and `follows`.

---

## 2. MAJOR -- Duplicated Elements, Confusing Navigation, Mobile Overflow

### 2.1 Console Error: Dialog Missing DialogTitle (Accessibility)
- **Source:** Console logs show repeated errors: `DialogContent requires a DialogTitle`
- **Files:** Multiple admin pages use `Dialog` or `DialogContent` without proper `DialogTitle` or with conditionally rendered titles. Likely candidates: `AdminSocial.tsx`, `AdminDoctors.tsx`, `AdminClinics.tsx` (all import Dialog).
- **Fix:** Audit all `DialogContent` usages across admin pages and ensure each has a `DialogTitle`. For cases where the title should be visually hidden, wrap it in `VisuallyHidden` from Radix.

### 2.2 CMS Articles Tab: Table Not Mobile-Optimized
- **File:** `src/components/admin/cms/CMSArticlesTab.tsx`
- **Issue:** The articles list uses a `Table` component on all viewports. While it hides some columns with `hidden sm:table-cell` and `hidden md:table-cell`, the core table still causes horizontal scroll on narrow devices. The Marketplace tab already has a proper mobile card view pattern.
- **Fix:** Add a mobile card layout (similar to `CMSMarketplaceTab`) that shows article title, status badge, and action buttons in a vertical card format, using `useIsMobile()` to switch.

### 2.3 CMS Categories Not Seeded
- **File:** `src/pages/admin/AdminCMSEditor.tsx` (line 243)
- **Issue:** The category `Select` dropdown pulls from `cms_categories` table, but no seed data was inserted in the migration. The dropdown will be empty, making it impossible to create articles without manually inserting categories.
- **Fix:** Insert default categories via migration: `health-tips`, `vet-care`, `announcements`, `news`, `pet-guides`.

### 2.4 Marketplace Tab: Missing Mobile Active Toggle
- **File:** `src/components/admin/cms/CMSMarketplaceTab.tsx` (line 148-169)
- **Issue:** The mobile card layout shows product name, stock badge, and +/- buttons, but omits the Active/Inactive toggle that exists in the desktop table view. Admins on mobile cannot toggle product visibility.
- **Fix:** Add a small `Switch` component to the mobile card layout.

---

## 3. MINOR -- Spacing, Styling, Polish

### 3.1 Stat Cards Missing `href` Links
- **Files:** `CMSSocialTab.tsx`, `CMSClinicalTab.tsx`
- **Issue:** Some stat cards (e.g., "Active Discussions", "Pending Verifications") don't have `href` props linking to their respective management pages. The Marketplace tab correctly links "Total Products" to `/admin/products`. Consistency would improve navigation.
- **Fix:** Add `href="/admin/social"` to the social stats, `href="/admin/doctors"` to pending verifications.

### 3.2 CMS Realtime Does Not Invalidate Content Hub Tab Caches
- **File:** `src/hooks/useAdminRealtimeDashboard.ts` (line 115-119)
- **Issue:** The CMS realtime subscription invalidates `cms-articles` and `cms-stats`, but the Content Hub tabs use their own query keys: `cms-social-stats`, `cms-recent-posts`, `cms-marketplace-stats`, `cms-products-quick`, `cms-clinical-stats`, `cms-pending-doctors`, `cms-clinics-status`. These are not invalidated by realtime events.
- **Fix:** Extend the realtime subscriptions to also invalidate the Content Hub tab query keys when relevant tables change (posts, products, doctors, clinics).

### 3.3 AdminSettings Has Redundant Redirect Logic
- **File:** `src/pages/admin/AdminSettings.tsx` (lines 215-218)
- **Issue:** The `useEffect` redirect logic duplicates `RequireAdmin`. Once migrated to `RequireAdmin`, these 4 lines plus the loading/access-denied renders (lines 249-268) can be removed entirely.
- **Fix:** Addressed as part of fix 1.3.

---

## Implementation Priority

| Priority | Issue | Impact |
|----------|-------|--------|
| P0 | 1.5 + 1.6: Add admin DELETE RLS policies on posts, comments, likes, pets, stories, follows | Admin moderation is non-functional |
| P0 | 1.1: Fix realtime toast navigation path | 404 on new contact message |
| P0 | 2.3: Seed CMS categories | Article creation is blocked |
| P1 | 1.2: Sync mobile nav label | Confusing UX |
| P1 | 1.3: Migrate AdminSettings to RequireAdmin | Code hygiene, consistency |
| P1 | 1.4: Fix Markdown preview | CMS editor preview broken |
| P1 | 2.1: Fix DialogTitle accessibility errors | Console errors, screen reader |
| P1 | 2.2: Mobile card view for articles tab | Mobile usability |
| P1 | 2.4: Add active toggle to mobile marketplace cards | Feature parity |
| P2 | 3.1: Add href to stat cards | Navigation convenience |
| P2 | 3.2: Extend realtime invalidation for CMS tabs | Data freshness |

## Files to Edit

| File | Changes |
|------|---------|
| `supabase/migrations/xxx.sql` | Add admin DELETE policies on posts, comments, likes, pets, stories, follows; seed cms_categories |
| `src/hooks/useAdminRealtimeDashboard.ts` | Fix navigation path, extend query invalidation |
| `src/components/admin/AdminMobileNav.tsx` | Rename "Content / CMS" to "Content Hub" |
| `src/pages/admin/AdminSettings.tsx` | Wrap in RequireAdmin, remove manual guard |
| `src/pages/admin/AdminCMSEditor.tsx` | Add Markdown-to-HTML conversion for preview |
| `src/components/admin/cms/CMSArticlesTab.tsx` | Add mobile card layout |
| `src/components/admin/cms/CMSMarketplaceTab.tsx` | Add Switch to mobile cards |
| `src/components/admin/cms/CMSSocialTab.tsx` | Add href to stat cards |
| `src/components/admin/cms/CMSClinicalTab.tsx` | Add href to stat cards |
| Multiple admin pages | Audit and fix DialogTitle accessibility |
