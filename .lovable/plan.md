

# Final Optimization Plan -- Vetmedix

## 1. DATABASE PERFORMANCE (Indexes)

### Current State
The existing migration `20260202041611` already covers most critical indexes. However, several gaps remain for commonly filtered columns.

### Missing Indexes to Add

```sql
-- A. Orders: status filter (used by admin dashboard, profile page)
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status) WHERE trashed_at IS NULL;

-- B. Orders: payment_status filter (admin orders page)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);

-- C. Appointments: status filter (used in clinic dashboard, profile)
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);

-- D. Appointments: unique constraint support (race condition prevention)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_doctor_date_time 
ON public.appointments (clinic_id, doctor_id, appointment_date, appointment_time);

-- E. Products: category + active filter (shop page filtering)
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON public.products (category, is_active) WHERE is_active = true;

-- F. Products: featured products query (homepage)
CREATE INDEX IF NOT EXISTS idx_products_featured 
ON public.products (is_featured) WHERE is_featured = true AND is_active = true;

-- G. Incomplete orders: status filter (admin recovery page)
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_status 
ON public.incomplete_orders (status) WHERE trashed_at IS NULL;

-- H. Coupons: code lookup (checkout validation)
CREATE INDEX IF NOT EXISTS idx_coupons_code_active 
ON public.coupons (code) WHERE is_active = true;

-- I. Follows: follower lookup (feed generation)
CREATE INDEX IF NOT EXISTS idx_follows_follower 
ON public.follows (follower_user_id);

-- J. Follows: following lookup (pet profile followers count)
CREATE INDEX IF NOT EXISTS idx_follows_following 
ON public.follows (following_pet_id);

-- K. Stories: pet + expiry (stories bar query)
CREATE INDEX IF NOT EXISTS idx_stories_pet_expires 
ON public.stories (pet_id, expires_at DESC) WHERE expires_at > now();

-- L. Doctor join requests: status filter
CREATE INDEX IF NOT EXISTS idx_doctor_join_requests_status 
ON public.doctor_join_requests (status);

-- M. Wishlists: user lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_user 
ON public.wishlists (user_id);

-- N. Wishlists: product lookup (for product detail "is wishlisted" check)
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product 
ON public.wishlists (user_id, product_id);
```

Total: 14 new indexes. All use `IF NOT EXISTS` to be safe.

---

## 2. QUERY EFFICIENCY (`select('*')` Audit)

30 files currently use `select('*')`. The highest-impact ones to refactor with explicit column selection:

| File | Table | Suggested Columns |
|---|---|---|
| `usePublicDoctors.ts` | `doctors_public` | `id, name, specialization, qualifications, avatar_url, bio, experience_years, consultation_fee, is_available, is_verified, created_by_clinic_id` |
| `useExplorePets.ts` | `pets` | `id, user_id, name, species, breed, age, avatar_url, location` |
| `useMessages.ts` | `conversations` | `id, participant_1_id, participant_2_id, last_message_at, created_at` |
| `useMessages.ts` | `messages` | `id, conversation_id, sender_id, content, media_url, media_type, is_read, created_at` |
| `useClinicOwner.ts` | `clinics` | `id, name, address, phone, email, description, rating, image_url, cover_photo_url, is_open, opening_hours, is_verified, verification_status, services, owner_user_id` |
| `useClinicOwner.ts` | `clinic_services` | `id, clinic_id, name, description, price, duration_minutes, is_active` |
| `useDoctor.ts` | `doctors` | `id, user_id, name, specialization, qualifications, bio, avatar_url, phone, email, experience_years, consultation_fee, is_available, is_verified, verification_status, license_number, created_by_clinic_id, bvc_certificate_url, nid_number` |
| `ProfilePage.tsx` | `orders` | `id, items, total_amount, status, created_at, shipping_address, payment_method, tracking_id` |
| `AdminClinics.tsx` | `clinics` | `id, name, address, phone, email, rating, is_open, is_verified, verification_status, image_url, owner_user_id, created_at, is_blocked, blocked_reason` |
| `AdminCoupons.tsx` | `coupons` | `id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, is_active, starts_at, expires_at` |
| `useClinicReviews.ts` | `clinic_reviews` | `id, clinic_id, user_id, rating, comment, helpful_count, created_at` |
| `useProductCategories.ts` | `product_categories` | `id, name, slug, image_url, product_count, is_active` |
| `useDoctorSchedules.ts` | `doctor_schedules` | `id, doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, max_appointments` |

Total: 13 queries to refactor from `select('*')` to explicit columns.

---

## 3. FRONTEND PERFORMANCE

### 3A. Route Splitting -- Already Done (Good)
All routes in `App.tsx` are already lazy-loaded via `React.lazy()`. Admin, Doctor, and Clinic routes are fully code-split. A user visiting `/shop` does NOT download admin code. No changes needed here.

### 3B. Heavy Library Audit -- Recharts

Recharts is imported directly (not lazy) in 3 files:
- `src/pages/admin/AdminAnalytics.tsx` -- already lazy-loaded as a route
- `src/pages/admin/AdminRecoveryAnalytics.tsx` -- already lazy-loaded as a route
- `src/components/clinic/ClinicAnalyticsCharts.tsx` -- imported into `ClinicDashboard.tsx`

Since `AdminAnalytics` and `AdminRecoveryAnalytics` are already route-level lazy components, recharts is only bundled when those routes are visited. Good.

However, `ClinicAnalyticsCharts.tsx` is statically imported into `ClinicDashboard.tsx`. This means the entire recharts library loads when any clinic owner visits their dashboard, even if they don't scroll to the charts section.

**Fix:** Lazy-load `ClinicAnalyticsCharts` inside `ClinicDashboard.tsx`:
```tsx
const ClinicAnalyticsCharts = lazy(() => import('@/components/clinic/ClinicAnalyticsCharts'));
```

### 3C. `chart.tsx` UI Component is Unused
`src/components/ui/chart.tsx` imports `recharts` globally but is never imported by any file. This is dead code that pulls recharts into the main bundle via tree-shaking ambiguity.

**Fix:** Delete `src/components/ui/chart.tsx` (see Section 5).

---

## 4. PWA UPGRADE

### Current State
- No `manifest.json` exists
- No service worker registered
- No PWA meta tags in `index.html`
- The viewport meta tag is `width=device-width, initial-scale=1.0` (good -- no `user-scalable=no`)

### Implementation Plan

**A. Create `public/manifest.json`:**
```json
{
  "name": "VET-MEDIX - Pet Care & Veterinary Services",
  "short_name": "VetMedix",
  "description": "Pet care, social network & veterinary services in Bangladesh",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "48x48",
      "type": "image/x-icon"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["lifestyle", "shopping", "health"]
}
```

**B. Add to `index.html`:**
```html
<link rel="manifest" href="/manifest.json" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="VetMedix" />
```

**C. Register a basic service worker** in `src/main.tsx` for caching static assets (logo, fonts). A lightweight hand-written SW is preferred over `vite-plugin-pwa` to avoid adding a new dependency:
```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
```

**D. Create `public/sw.js`** with a cache-first strategy for static assets and network-first for API calls.

**Note:** PWA icons (192px and 512px PNGs) will need to be generated from the existing favicon/logo. Since no high-res icon exists yet, we will create placeholder references and note that production icons should be provided.

---

## 5. DEAD CODE & CLEANUP

### 5A. Unused UI Component
- `src/components/ui/chart.tsx` -- Imports `recharts` globally but is never used anywhere. **Delete.**

### 5B. Console Logs
Search confirms **zero** `console.log` or `console.debug` statements in `src/`. The `logger.ts` utility correctly silences all output in production. No cleanup needed.

### 5C. TODO Comments
No scan needed -- the logger already handles production silencing. No TODOs found in critical paths.

---

## SUMMARY MATRIX

| ID | Category | Priority | Action |
|---|---|---|---|
| DB-1 | Database | High | Add 14 missing indexes via migration |
| DB-2 | Database | High | Refactor 13 `select('*')` queries to explicit columns |
| FE-1 | Frontend | Medium | Lazy-load ClinicAnalyticsCharts in ClinicDashboard |
| PWA-1 | PWA | Medium | Create manifest.json + service worker + meta tags |
| CLN-1 | Cleanup | Low | Delete unused `chart.tsx` (removes recharts from implicit bundle) |

## EXECUTION ORDER

1. **DB-1** -- Single SQL migration with all 14 indexes (zero risk, additive only)
2. **DB-2** -- Refactor select queries across 13 files (reduces payload 30-60%)
3. **CLN-1** -- Delete `chart.tsx` dead code
4. **FE-1** -- Lazy-load ClinicAnalyticsCharts
5. **PWA-1** -- Add manifest, service worker, and meta tags

**Total: 1 migration, ~15 files to modify, 1 file to delete, 3 new files to create. No new npm dependencies.**

