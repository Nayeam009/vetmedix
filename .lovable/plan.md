

# CMS Implementation Plan for Vetmedix

## What This Adds

A full Content Management System integrated into the admin panel, allowing you to create and publish articles like Health Tips, Vet Care Guides, Pet Announcements, and News -- visible to all visitors on a new public Blog/Resources page.

---

## Phase 1: Database Setup

### Table: `cms_articles`

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| title | TEXT NOT NULL | Article title |
| slug | TEXT UNIQUE NOT NULL | URL path (e.g. `/blog/how-to-bathe-your-cat`) |
| content | TEXT | HTML body content |
| excerpt | TEXT | Short summary for cards and SEO |
| featured_image | TEXT | URL from storage bucket |
| status | TEXT DEFAULT 'draft' | 'draft', 'published', 'archived' |
| author_id | UUID NOT NULL | References auth.users |
| category | TEXT NOT NULL | e.g. 'health-tips', 'vet-care', 'announcements', 'news' |
| tags | TEXT[] | Searchable tag array |
| published_at | TIMESTAMPTZ | Auto-set when status becomes 'published' |
| created_at / updated_at | TIMESTAMPTZ | Timestamps with auto-update trigger |

### Table: `cms_categories`

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID (PK) | Unique identifier |
| name | TEXT NOT NULL | Display name |
| slug | TEXT UNIQUE NOT NULL | URL-friendly key |
| description | TEXT | Optional |
| is_active | BOOLEAN DEFAULT true | Soft-disable |

### Storage
- New public bucket: `cms-media` for article images
- RLS: Anyone can read; only admins can upload/delete

### Security (RLS)
- **SELECT on cms_articles**: Anyone can read rows where `status = 'published'`; admins can read all
- **INSERT/UPDATE/DELETE on cms_articles**: Only users with `admin` role via `has_role(auth.uid(), 'admin')`
- **SELECT on cms_categories**: Anyone can read active categories
- **INSERT/UPDATE/DELETE on cms_categories**: Admin only

### Realtime
- Enable realtime on `cms_articles` for live admin dashboard updates

### Trigger
- Reuse existing `update_updated_at_column()` trigger on cms_articles

---

## Phase 2: Data Layer

### New Hook: `src/hooks/useCMS.ts`

Wraps TanStack Query for all CMS operations:

- `useCMSArticles(filters)` -- Paginated list with status/category/search filters (admin sees all, public sees published only)
- `useCMSArticle(id)` -- Single article by ID (admin editor)
- `useCMSArticleBySlug(slug)` -- Single article by slug (public view)
- `useCreateArticle()` -- Insert mutation
- `useUpdateArticle()` -- Update mutation with cache invalidation
- `useDeleteArticle()` -- Delete mutation
- `useCMSCategories()` -- Category list
- `useCMSStats()` -- Counts for dashboard (total, drafts, published this month)

All queries use explicit column selects (no `.select('*')`), consistent with the optimization work already done.

---

## Phase 3: Admin Panel Integration

### Navigation Update
Add "Content / CMS" to both `AdminSidebar.tsx` and `AdminMobileNav.tsx`:
- Icon: `FileText` from lucide-react
- Placed in the **Platform** section between "Social" and "User Management"
- Badge showing draft article count

### New Page: `src/pages/admin/AdminCMS.tsx`
- Route: `/admin/cms`
- Uses `AdminLayout` + `RequireAdmin` (existing patterns)
- Tab filters: All / Draft / Published / Archived
- Search bar filtering by title
- Data table with columns: Title, Category, Status badge, Published Date, Actions (Edit/Delete/Preview)
- "New Article" button
- Bulk actions: Publish selected drafts, archive selected

### New Page: `src/pages/admin/AdminCMSEditor.tsx`
- Route: `/admin/cms/new` and `/admin/cms/:id/edit`
- Form fields using `react-hook-form` + `zod`:
  - Title (auto-generates slug, editable)
  - Category (select from cms_categories)
  - Tags (comma-separated input)
  - Excerpt (textarea, max 300 chars)
  - Status (Draft/Published/Archived)
- **Rich text**: Simple textarea with Markdown support initially. Content stored as HTML after conversion. No heavy editor dependency added -- keeps the bundle lean. A visual preview toggle shows the rendered output side-by-side.
- **Image upload**: Drag-and-drop zone uploading to `cms-media` bucket, returns public URL inserted into the featured_image field
- Save as Draft / Publish buttons with appropriate `published_at` logic

---

## Phase 4: Public-Facing Blog

### New Page: `src/pages/BlogPage.tsx`
- Route: `/blog` (lazy-loaded)
- Fetches only `status = 'published'` ordered by `published_at DESC`
- Card grid with featured image, title, excerpt, category badge, date
- Category filter tabs
- Responsive: 1 column mobile, 2 tablet, 3 desktop
- Pagination (12 per page)

### New Page: `src/pages/BlogArticlePage.tsx`
- Route: `/blog/:slug` (lazy-loaded)
- Full article view with rendered HTML content
- Author name (from profiles), published date, category, tags
- Related articles section (same category, max 3)
- SEO meta tags via existing `SEO` component

### Navigation Updates
- Add "Blog" link to the main `Navbar.tsx` nav links array
- Add "Blog" to the `Footer.tsx` quick links

---

## Phase 5: Dashboard and Realtime Integration

- Add `cms_articles` subscription to `useAdminRealtimeDashboard.ts` for live cache invalidation
- Add CMS stats to the admin dashboard (total articles, drafts pending, published this week) as a new card in the Platform Overview section
- Update `get_admin_dashboard_stats()` RPC to include CMS counts

---

## Files to Create (8 new)

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_create_cms_tables.sql` | Schema, RLS, storage bucket, triggers, realtime |
| `src/hooks/useCMS.ts` | All CMS data hooks |
| `src/pages/admin/AdminCMS.tsx` | CMS article list page |
| `src/pages/admin/AdminCMSEditor.tsx` | Article editor with form + image upload |
| `src/pages/BlogPage.tsx` | Public blog listing |
| `src/pages/BlogArticlePage.tsx` | Public article detail |
| `src/components/admin/cms/ArticleStatusBadge.tsx` | Reusable status badge |
| `src/components/blog/ArticleCard.tsx` | Public article card component |

## Files to Edit (7 existing)

| File | Change |
|------|--------|
| `src/App.tsx` | Add 4 lazy routes: `/admin/cms`, `/admin/cms/new`, `/admin/cms/:id/edit`, `/blog`, `/blog/:slug` |
| `src/components/admin/AdminSidebar.tsx` | Add CMS nav item to Platform section |
| `src/components/admin/AdminMobileNav.tsx` | Add CMS nav item to Platform section |
| `src/components/Navbar.tsx` | Add "Blog" to navLinks array |
| `src/components/Footer.tsx` | Add "Blog" to quickLinks array |
| `src/hooks/useAdminRealtimeDashboard.ts` | Subscribe to cms_articles changes |
| `src/components/admin/dashboard/PlatformOverview.tsx` | Add CMS stats card |

## Implementation Order

1. Database migration (schema + RLS + storage + triggers + realtime)
2. `useCMS` hook with all queries and mutations
3. Admin CMS list page + sidebar/mobile nav updates
4. Admin CMS editor page with image upload
5. Public blog pages + navbar/footer links
6. Dashboard integration and realtime subscription
7. End-to-end testing

