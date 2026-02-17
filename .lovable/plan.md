
# Deep System Audit: Fix and Polish Plan — COMPLETED ✅

All issues from the audit have been implemented.

## Completed Fixes

### P0 — Critical (Done ✅)
- **1.5 + 1.6:** Added admin DELETE RLS policies on `posts`, `comments`, `likes`, `pets`, `stories`, `follows`
- **1.1:** Fixed realtime toast navigation from `/admin/contact-messages` → `/admin/messages`
- **2.3:** Seeded CMS categories (`health-tips`, `vet-care`, `announcements`, `news`, `pet-guides`)

### P1 — Major (Done ✅)
- **1.2:** Synced mobile nav label to "Content Hub"
- **1.3:** Migrated `AdminSettings` to use `<RequireAdmin>` wrapper, removed ~50 lines of manual guard
- **1.4:** Added Markdown-to-HTML converter for CMS editor preview
- **2.2:** Added mobile card layout to `CMSArticlesTab` using `useIsMobile()`
- **2.4:** Added `Switch` toggle to mobile marketplace cards for product active/inactive

### P2 — Polish (Done ✅)
- **3.1:** Added `href` links to stat cards in `CMSSocialTab` and `CMSClinicalTab`
- **3.2:** Extended realtime invalidation for all CMS Content Hub tab query keys

### Remaining (Not addressed this cycle)
- **2.1:** DialogTitle accessibility audit across admin pages — requires broader audit of all Dialog usages
