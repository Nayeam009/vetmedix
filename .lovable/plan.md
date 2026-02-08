
# Admin Analytics Page -- Priority Improvements

Based on a thorough audit of the current analytics page, database state, and admin workflow, here are the most important improvements focused on what an admin actually needs day-to-day.

---

## Current State Summary

- **6 orders** (all cancelled/rejected -- so active revenue is 0)
- **6 products with 0 stock** (out of 76 total)
- **15 users**, **25 clinics**, **7 doctors**, **5 appointments**, **7 posts**
- No date filtering, no export, no low-stock alerts, no contact message tracking
- Full-page loading spinner instead of skeleton loading
- Stat cards are not clickable (no quick navigation)

---

## Priority 1: Actionable Admin Alerts (High Impact)

### Low Stock Product Alerts
- Add a prominent alert section at the top of the analytics page showing products with stock <= 5 (currently 6 products at 0 stock)
- Each alert row shows product name, current stock, and a link to edit that product
- This is critical for an e-commerce admin to avoid missed sales

### Unread Contact Messages Counter
- Query `contact_messages` where `status = 'unread'` and show the count
- Display as a notification badge in the Platform Overview section
- Add to the `useAdminAnalytics` hook data

---

## Priority 2: Date Range Filter (High Impact)

- Add a filter bar at the top of the analytics page with preset buttons: **Today**, **7 Days**, **30 Days**, **90 Days**, **All Time**
- All revenue, order, and trend charts will recalculate based on the selected range
- The date range state is passed into the `useAdminAnalytics` hook to filter order data accordingly
- Daily trends chart adapts its x-axis to the selected range

---

## Priority 3: CSV Export (Medium Impact)

- Add an export button (download icon) in the analytics page header
- Export options: **Revenue Report**, **Order Summary**, **User Data**
- Generates and downloads a CSV file from the current analytics data
- Uses the existing `csvParser.ts` utility pattern already in the codebase

---

## Priority 4: Skeleton Loading States (UX Polish)

- Replace the full-page `Loader2` spinner with skeleton placeholders that match the layout
- 4 skeleton stat cards for the revenue row
- 6 skeleton stat cards for the platform overview
- Skeleton rectangles for chart areas
- This makes the page feel much faster on load

---

## Priority 5: Clickable Stat Cards with Navigation (UX Polish)

- Make each `AnalyticsStatCard` clickable to navigate to its corresponding admin page:
  - Revenue -> `/admin/orders`
  - Orders -> `/admin/orders`
  - Users -> `/admin/customers`
  - Clinics -> `/admin/clinics`
  - Doctors -> `/admin/doctors`
  - Products -> `/admin/products`
  - Appointments -> `/admin/clinics`
- Add subtle hover cursor and visual feedback
- Add a "Last updated" timestamp with a manual refresh button at the top

---

## Priority 6: Doctor & Clinic Verification Funnel (Admin Workflow)

- Expand the existing clinic health section into a proper verification funnel:
  - Show `not_submitted` / `pending` / `approved` / `rejected` counts for both doctors and clinics
  - Progress bars for each stage
- Add pending doctor verifications count (currently tracked but not prominently displayed)

---

## Technical Details

### Files to modify:
1. **`src/hooks/useAdminAnalytics.ts`** -- Add new data fields:
   - `lowStockProducts: Array<{id, name, stock, price}>` (products with stock <= 5)
   - `unreadMessages: number`
   - `doctorVerificationFunnel: {not_submitted, pending, approved, rejected}`
   - Accept `dateRange` parameter to filter order calculations

2. **`src/components/admin/AnalyticsStatCard.tsx`** -- Add optional `href` and `onClick` props, wrap in a clickable container with cursor-pointer and hover effect

3. **`src/pages/admin/AdminAnalytics.tsx`** -- Major updates:
   - Add date range filter bar (state-managed with preset buttons)
   - Add low stock alerts section (collapsible, shows product name + stock + edit link)
   - Add CSV export dropdown button
   - Replace loading spinner with skeleton cards
   - Wire stat cards to navigate to their admin pages
   - Add "Last updated" indicator with refresh button
   - Add unread contact messages to platform overview

4. **`src/components/admin/AnalyticsChartCard.tsx`** -- No changes needed (already well-structured)

### New utility:
- CSV export helper function (inline in analytics page or shared utility) to convert analytics data to downloadable CSV

### No database migrations needed -- all data is already available in existing tables.
