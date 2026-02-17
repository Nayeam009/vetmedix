

# Segmented CMS Dashboard for Vetmedix Admin Panel

## Overview

Transform the existing `/admin/cms` page from a simple article list into a 3-tab CMS dashboard that provides unified content management across Social, E-commerce, and Clinical Operations -- while keeping the existing dedicated pages (`/admin/social`, `/admin/products`, `/admin/doctors`) intact as deep-dive views.

---

## Architecture

The CMS page becomes the **command center** with summary views and quick actions. Each tab lazy-loads its content independently. The existing full pages remain accessible from the sidebar for detailed management.

### File Structure

```text
src/components/admin/cms/
  ArticleStatusBadge.tsx    (existing - keep)
  CMSSocialTab.tsx           (new - social moderation summary)
  CMSMarketplaceTab.tsx      (new - product/order quick view)
  CMSClinicalTab.tsx         (new - doctor/clinic verification hub)
  CMSArticlesTab.tsx         (new - extracted from current AdminCMS)
```

---

## Phase 1: Restructure AdminCMS.tsx

### Current State
`/admin/cms` shows only an article list with status filters.

### New State
`/admin/cms` becomes a tabbed dashboard with 4 sections:

| Tab | Label | Content |
|-----|-------|---------|
| articles | Articles | Current article list (extracted to `CMSArticlesTab`) |
| social | Community | Social moderation summary with post/comment stats and quick delete |
| marketplace | Marketplace | Product grid with inline stock editing, recent orders summary |
| clinical | Clinical Ops | Doctor verification queue, clinic status toggles |

### Mobile-First Navigation
- **Desktop**: Horizontal `TabsList` at the top
- **Mobile**: `Select` dropdown replacing tabs to save vertical space, with a sticky position so it remains accessible during scroll

---

## Phase 2: Tab 1 -- Articles (Extract from current page)

Extract the existing article list, filters, and pagination from `AdminCMS.tsx` into `CMSArticlesTab.tsx`. This is a direct extraction with no logic changes -- just component isolation for code splitting.

---

## Phase 3: Tab 2 -- Community and Social (`CMSSocialTab.tsx`)

### Data Sources
- `posts` table (counts, recent flagged)
- `comments` table (recent, deletable)
- `pets` table (count)
- `likes` table (count)

### UI Components
- **3 Stat Cards**: Total Posts, Active Discussions (comments today), Pet Profiles
- **Recent Posts List**: Last 10 posts with pet avatar, content preview, like/comment counts
- **Quick Actions**: Delete post button with confirmation dialog, "View in Social" link to `/admin/social`
- **Mobile**: Cards stack vertically, action buttons use icon-only mode

### Data Fetching
Reuses existing query patterns from `AdminSocial.tsx` but with lighter queries (limit 10, no full joins).

---

## Phase 4: Tab 3 -- Marketplace (`CMSMarketplaceTab.tsx`)

### Data Sources
- `products` table (stock levels, active status)
- `orders` table (recent pending)

### UI Components
- **3 Stat Cards**: Total Products, Out of Stock count, Pending Orders
- **Product Quick List**: Table on desktop / Card layout on mobile
  - Columns: Name, Stock (editable inline), Price, Active toggle
  - Mobile: Hides Price column, shows compact cards with stock +/- buttons
- **Recent Orders**: Last 5 pending orders with status badges
- **Quick Actions**: "Manage Products" link to `/admin/products`, "View Orders" link to `/admin/orders`

### Inline Stock Edit
Same pattern as `AdminProducts.tsx` quick stock update -- direct Supabase mutation with cache invalidation.

---

## Phase 5: Tab 4 -- Clinical Ops (`CMSClinicalTab.tsx`)

### Data Sources
- `doctors` table (verification_status, is_blocked)
- `clinics` table (is_verified, is_blocked)

### UI Components
- **3 Stat Cards**: Total Doctors, Pending Verifications, Blocked Accounts
- **Verification Queue**: List of doctors with `verification_status = 'pending'`
  - Each card shows: Name, specialization, submitted date, BVC certificate thumbnail
  - Actions: Approve / Reject buttons (reuses mutation logic from `AdminDoctors.tsx`)
  - Certificate image opens in a lightweight dialog (not a full lightbox dependency)
- **Clinic Status List**: Clinics with toggle switches for `is_blocked` status
- **Quick Actions**: "Manage Doctors" link to `/admin/doctors`, "Manage Clinics" link to `/admin/clinics`

### Security
All mutations use existing RLS policies -- admin-only write access enforced at the database level via `has_role(auth.uid(), 'admin')`.

---

## Phase 6: Performance Optimizations

### Code Splitting
Each tab component is wrapped in `React.lazy()` inside `AdminCMS.tsx`:

```text
const CMSArticlesTab = lazy(() => import('./cms/CMSArticlesTab'))
const CMSSocialTab = lazy(() => import('./cms/CMSSocialTab'))
const CMSMarketplaceTab = lazy(() => import('./cms/CMSMarketplaceTab'))
const CMSClinicalTab = lazy(() => import('./cms/CMSClinicalTab'))
```

Only the active tab's component loads. Switching tabs triggers lazy loading with a skeleton fallback.

### TanStack Query
All queries use `staleTime: 30000` and existing cache keys to prevent refetching when switching tabs. The `keepPreviousData` equivalent (`placeholderData: keepPreviousData`) prevents layout jank.

### Mobile Sheet for Edits
When editing stock or reviewing doctor details on mobile, a `Sheet` (side drawer) is used instead of `Dialog` to provide better keyboard accessibility and vertical scroll space.

---

## Phase 7: Sidebar Update

Update `AdminSidebar.tsx` to rename "Content / CMS" to "Content Hub" and keep the path at `/admin/cms`. No new routes needed -- the tabs are managed via component state (or URL search params for deep-linking).

---

## Database Changes

**None required.** All tables (`posts`, `comments`, `products`, `orders`, `doctors`, `clinics`) already exist with appropriate RLS policies. No schema modifications needed.

---

## Files to Create (4 new)

| File | Purpose |
|------|---------|
| `src/components/admin/cms/CMSArticlesTab.tsx` | Extracted article list from AdminCMS |
| `src/components/admin/cms/CMSSocialTab.tsx` | Social moderation summary tab |
| `src/components/admin/cms/CMSMarketplaceTab.tsx` | Product/order quick management tab |
| `src/components/admin/cms/CMSClinicalTab.tsx` | Doctor/clinic verification tab |

## Files to Edit (2 existing)

| File | Change |
|------|--------|
| `src/pages/admin/AdminCMS.tsx` | Complete rewrite to tabbed layout with lazy tabs and mobile Select |
| `src/components/admin/AdminSidebar.tsx` | Rename label to "Content Hub" |

## Implementation Order

1. Extract current article list into `CMSArticlesTab.tsx`
2. Build `CMSSocialTab.tsx` with stats and recent posts
3. Build `CMSMarketplaceTab.tsx` with product quick-edit and orders
4. Build `CMSClinicalTab.tsx` with verification queue
5. Rewrite `AdminCMS.tsx` with tab navigation and lazy loading
6. Update sidebar label
7. Test all tabs on mobile and desktop viewports

