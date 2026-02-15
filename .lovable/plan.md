# E-Commerce Customers: Roles, Bulk Selection, Payment Status Update & Cross-Page Sync

## Overview

Enhance the E-Commerce Customers page with role badges, bulk selection, admin payment status update, and ensure real-time data consistency across the Orders, Incomplete Orders, and Customer pages.

---

## Changes

### 1. Add Role Badges per Customer

- Fetch `user_roles` table alongside profiles
- Display role badges (Pet Parent, Doctor, Clinic Owner) next to each customer name
- Use existing color scheme: Doctor (Teal), Clinic Owner (Emerald), Pet Parent (default)
- Show in both mobile card view and desktop table view

### 2. Add Bulk Selection with Checkboxes

- Add checkboxes (circle/check icons) matching the Orders page pattern
- Select-all toggle in the table header
- Bulk action bar appears when items are selected with options:
  - **Bulk Update Payment Status** (paid/unpaid) for all selected customers' latest orders
  - **Export Selected** to CSV
- Mobile: checkbox on each card, desktop: checkbox column in table

### 3. Admin Payment Status Update

- Add a clickable payment status badge on each customer row
- Clicking opens a dropdown or small dialog to change payment status (paid/unpaid/refunded)
- Updates all non-cancelled orders for that customer via a batch update to the `orders` table
- Shows a toast confirmation and triggers real-time cache invalidation

### 4. Cross-Page Real-Time Connectivity

- The E-Commerce Customers page already subscribes to `orders` table changes
- Add subscription to `incomplete_orders` table changes as well so conversions from the Incomplete Orders page instantly reflect in customer stats
- Ensure the `admin-orders`, `admin-ecommerce-customers`, and `admin-stats` query keys are all invalidated when payment status changes, so:
  - Orders page reflects updated payment status
  - Dashboard stats update accordingly
  - Customer page stats (Total Sales, Paid, Pending) stay accurate

---

## Technical Details

### Files to Edit

1. `**src/pages/admin/AdminEcommerceCustomers.tsx**`
  - Add `user_roles` query to fetch roles for all customer user IDs
  - Add role badges rendering (small colored badges next to name)
  - Add checkbox column (mobile + desktop) using Circle/CheckCircle2 icons
  - Add `selectedIds` state (Set) and select-all toggle
  - Add bulk action bar (appears when selected) with "Update Payment" and "Export Selected"
  - Add per-row payment status click handler that opens a Select/dropdown to update status
  - On payment status change: update `orders` table, invalidate `admin-orders`, `admin-ecommerce-customers`, `admin-stats` query keys
  - Add `incomplete_orders` realtime subscription alongside existing `orders` subscription

### Data Flow for Payment Status Update

```text
Admin clicks payment badge on customer row
  -> Select: paid / unpaid / refunded
  -> UPDATE orders SET payment_status = ? WHERE user_id = ? AND status != 'cancelled'
  -> Invalidate: admin-ecommerce-customers, admin-orders, admin-stats
  -> Toast confirmation
  -> Realtime subscription auto-refreshes other open admin tabs
```

### Role Badge Display

```text
Query: SELECT user_id, role FROM user_roles WHERE user_id IN (customer_user_ids)
Display: colored badges -- Doctor (teal), Clinic Owner (emerald), Pet Parent (gray/default)
```

### No Database Changes Needed

All required tables and columns already exist. The `payment_status` column on orders supports 'paid', 'unpaid', and 'refunded' values. The `user_roles` table provides role data.

UI UX suitable for all screen size specially mobial. optimize the entire admin panel for realtime update & make sure no issue remains.