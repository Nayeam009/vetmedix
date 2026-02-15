
# Incomplete Orders Feature

## Overview
Track abandoned checkouts by capturing customer contact info (phone/email) when they visit the checkout page but don't complete the order. Admin can view, manage, and convert these into real orders. A Recovery Analytics page provides conversion insights.

---

## 1. Database: New `incomplete_orders` Table

Create a table to store abandoned checkout data:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Nullable (guest checkouts) |
| customer_name | text | From checkout form |
| customer_phone | text | From checkout form |
| customer_email | text | From user auth if available |
| items | jsonb | Cart items snapshot |
| cart_total | numeric | Cart value |
| shipping_address | text | Partial address if entered |
| division | text | For delivery zone info |
| completeness | integer | 0-100% form fill progress |
| status | text | 'incomplete', 'recovered', 'expired' |
| recovered_order_id | uuid | Links to orders table if converted |
| expires_at | timestamptz | Auto-expire after 30 days |
| created_at | timestamptz | When checkout started |
| updated_at | timestamptz | Last form interaction |

RLS policies:
- Admins: full CRUD access
- Users: can insert/update their own incomplete orders
- Enable realtime on this table

## 2. Checkout Page Integration

Modify `src/pages/CheckoutPage.tsx` to:
- On mount (if user has items), create/update an `incomplete_orders` record
- Track form field changes and update `completeness` percentage in real-time (debounced)
- Completeness calculation: Name (20%) + Phone (20%) + Address (20%) + Division/District/Thana (20%) + Payment selected (20%)
- When order is successfully placed, delete the incomplete order record (or mark as 'recovered')
- Use a `useEffect` cleanup or `beforeunload` to ensure the last state is saved

## 3. Admin Sidebar Updates

Add two new navigation items under E-Commerce section in both `AdminSidebar.tsx` and `AdminMobileNav.tsx`:
- "Incomplete Orders" at `/admin/incomplete-orders`
- "Recovery Analytics" at `/admin/recovery-analytics`

## 4. Incomplete Orders Page (`/admin/incomplete-orders`)

Inspired by the reference screenshot (image 1):

**Stats Bar (4 cards):**
- Total Incomplete Orders count
- Recovered Orders count
- Recovery Rate percentage
- Potential Lost Revenue (sum of incomplete cart totals)

**Revenue Banner:**
- Green: Total lost revenue from incomplete orders
- Shows count of incomplete orders

**Orders Table (Desktop) / Cards (Mobile):**
| Customer | Phone | Address | Cart Value | Completeness | Status | Actions |
|----------|-------|---------|------------|--------------|--------|---------|
| Name/Email | Phone | Partial address | Amount + item count | Progress % badge | Time ago | Convert / View / Delete |

- "Convert to Order" button opens a dialog pre-filled with the incomplete order data, allowing admin to place the order on behalf of the customer
- Completeness shown as color-coded badge (green 80-100%, yellow 50-79%, red below 50%)
- Real-time updates via Supabase subscription
- Search by name, phone, email
- Filter by completeness range and status

## 5. Recovery Analytics Page (`/admin/recovery-analytics`)

Inspired by reference screenshots (images 2 and 3):

**Stats Bar (4 cards):**
- Total Incomplete count
- Total Recovered count
- Recovery Rate %
- Recovered Revenue (BDT)

**Revenue Banners:**
- Green: Recovered Revenue total
- Orange: Lost Revenue (incomplete) total

**Charts Section:**
- Daily Conversion Trend (Bar chart: total vs recovered per day, last 14 days)
- Recovery Rate Trend (Line chart: daily recovery %, last 14 days)

**Bottom Section (3 columns):**
- Conversion Funnel (horizontal bars: Checkout Started -> Phone Entered -> Recovered)
- Conversion Ratio (Pie/Donut chart: Recovered vs Incomplete)
- Top Recovered Orders (ranked list with phone number, item count, amount)

**Date Filter:** Dropdown for 7 days, 15 days, 30 days, 90 days, All time

## 6. App Router Updates

Add two new lazy-loaded routes in `App.tsx`:
- `/admin/incomplete-orders` -> `AdminIncompleteOrders`
- `/admin/recovery-analytics` -> `AdminRecoveryAnalytics`

---

## Technical Details

### Files to Create
1. `src/pages/admin/AdminIncompleteOrders.tsx` - Incomplete orders list page
2. `src/pages/admin/AdminRecoveryAnalytics.tsx` - Recovery analytics dashboard
3. `src/hooks/useIncompleteOrders.ts` - Hook for fetching/managing incomplete orders with realtime
4. `src/hooks/useCheckoutTracking.ts` - Hook used in CheckoutPage to track form progress

### Files to Edit
1. `src/pages/CheckoutPage.tsx` - Add checkout tracking logic
2. `src/App.tsx` - Add 2 new admin routes
3. `src/components/admin/AdminSidebar.tsx` - Add nav items under E-Commerce
4. `src/components/admin/AdminMobileNav.tsx` - Add nav items under E-Commerce

### Database Migration
```sql
CREATE TABLE public.incomplete_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  shipping_address text,
  division text,
  completeness integer DEFAULT 0,
  status text DEFAULT 'incomplete',
  recovered_order_id uuid,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage incomplete orders"
  ON public.incomplete_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can manage their own
CREATE POLICY "Users can insert own incomplete orders"
  ON public.incomplete_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomplete orders"
  ON public.incomplete_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own incomplete orders"
  ON public.incomplete_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomplete orders"
  ON public.incomplete_orders FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.incomplete_orders;
```

### Checkout Tracking Flow
```text
User lands on /checkout with items in cart
  -> useCheckoutTracking hook creates incomplete_orders record
  -> As user fills form fields, completeness % updates (debounced 2s)
  -> If user completes order successfully:
     -> Mark incomplete_order as 'recovered', link recovered_order_id
  -> If user leaves without ordering:
     -> Record stays as 'incomplete' for admin to see
```

### Responsive Design
- Mobile: Card-based layouts with 44px touch targets
- Desktop: Full table views with all columns
- Charts use recharts (already installed) with responsive containers
