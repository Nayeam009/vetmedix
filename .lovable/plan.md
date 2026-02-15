
# E-Commerce Customer Management + Sidebar Restructure

## Overview
Split the current "Customers" page into two separate admin pages:
1. **User Management** (renamed from Customers) -- manages all platform users and their roles (admin, doctor, clinic owner, etc.)
2. **E-Commerce Customers** (new) -- focuses on shop buyers with payment/order history and revenue stats

Also restructure the admin sidebar to reflect this split, and prepare the orders schema for future payment gateway integration.

---

## Changes

### 1. Rename Current Page: Customers to User Management
- Rename `AdminCustomers.tsx` title from "Customers" to "User Management"
- Update subtitle to "Manage platform users, roles & permissions"
- Update sidebar label from "Customers" to "User Management" with a Shield icon
- Move it to stay under the "Platform" section

### 2. Create New Page: `AdminEcommerceCustomers.tsx`
A dedicated page at `/admin/ecommerce-customers` under the "E-Commerce" section. Inspired by the reference screenshots.

**Stats Bar** (4 cards, clickable filters):
- Total Sales (sum of all order amounts)
- Paid (sum where payment_status = 'paid')
- Pending (sum where payment_status = 'unpaid' and status != 'cancelled')
- Total Customers (unique buyers count)

**Customer Table** (aggregated from orders + profiles):
- Query orders grouped by `user_id`, joined with `profiles` for name/phone
- Columns: Customer (name + phone), Orders Count, Total Spent (BDT), Payment Method, Payment Status, Last Order Date
- Search by name or phone
- Filter by payment status (all, paid, unpaid)
- CSV export
- Mobile card view + desktop table view
- Pagination using existing `usePagination` hook

**Realtime**: Subscribe to orders table changes to auto-refresh stats and customer list.

### 3. Update Sidebar Navigation (`AdminSidebar.tsx` + `AdminMobileNav.tsx`)
Restructure the E-Commerce section:
```text
E-COMMERCE
  Products        - Manage inventory
  Orders          - Process orders
  Customers       - Payments & buyers    <-- NEW
  Coupons         - Discount codes
  Incomplete Orders - Abandoned checkouts
  Recovery Analytics - Recovery insights

PLATFORM
  Clinics         - Verify & manage
  Doctors         - Verify doctors
  Social          - Posts & content
  User Management - Roles & permissions  <-- RENAMED
  Messages        - Contact submissions
```

### 4. Add Route in `App.tsx`
- Add lazy import for `AdminEcommerceCustomers`
- Add route: `/admin/ecommerce-customers`

### 5. Payment Gateway Preparation
The `orders` table already has `payment_status` and `payment_reference` columns. The new Customers page will display these fields. No schema changes needed -- this lays the UI groundwork so when a payment gateway (e.g., bKash, SSLCommerz) is integrated later, the admin already has visibility into payment states.

---

## Technical Details

### Files to Create
1. **`src/pages/admin/AdminEcommerceCustomers.tsx`** -- New page with:
   - React Query to fetch orders with profile joins
   - Realtime subscription on orders table
   - Aggregation logic (group by user_id) computed via `useMemo`
   - Stats cards for revenue breakdown
   - Search, filter, pagination, CSV export
   - Mobile-first responsive layout matching existing admin patterns

### Files to Edit
2. **`src/pages/admin/AdminCustomers.tsx`** -- Change title to "User Management", update `useDocumentTitle`
3. **`src/components/admin/AdminSidebar.tsx`** -- Restructure nav sections, add new E-Commerce Customers entry, rename old Customers to User Management
4. **`src/components/admin/AdminMobileNav.tsx`** -- Mirror sidebar changes
5. **`src/App.tsx`** -- Add lazy import and route for `/admin/ecommerce-customers`

### No Database Changes Needed
All required columns (`payment_status`, `payment_reference`, `payment_method`) already exist on the orders table. The new page reads from existing `orders` and `profiles` tables using existing admin RLS policies.

### Key Data Query Pattern
```text
orders (grouped by user_id)
  -> JOIN profiles ON orders.user_id = profiles.user_id
  -> Aggregate: COUNT(*) as order_count, SUM(total_amount) as total_spent
  -> Latest payment_status, payment_method from most recent order
```

### Responsive Design
- Stats: 2-col on mobile, 4-col on desktop
- Table: Card layout on mobile, full table on desktop
- Touch targets: minimum 44x44px
- Active:scale-95 feedback on interactive elements
