

# Admin Orders Page Overhaul

## What Will Change

The `/admin/orders` page will be redesigned with inspiration from the reference screenshots, adding one-click courier dispatch via the Steadfast API, real-time order tracking, and future payment gateway readiness.

---

## 1. One-Click "Send to Courier" via Steadfast API

**Current behavior**: Admin manually enters a tracking ID when accepting an order.

**New behavior**: When admin clicks "Accept & Ship" on a pending order, the system will:
- Auto-fill order details (customer name, phone, address, COD amount) from the order record
- Call the Steadfast API `create_order` action via the existing edge function
- Automatically save the returned `tracking_code` and `consignment_id` to the order
- Update order status to "processing" in one click
- No manual ID entry required

The `AcceptOrderDialog` will be redesigned with two modes:
- **Quick Ship**: One-click send to Steadfast (auto-fills everything)
- **Manual**: Enter tracking ID manually (fallback option)

## 2. Real-Time Auto-Tracking

**New feature**: Orders with a `consignment_id` will be auto-tracked.

- A new "Track" button on each shipped/processing order will call the Steadfast API to fetch live delivery status
- The tracking status will be displayed inline in the order row and detail dialog
- A visual delivery timeline (Picked Up -> In Transit -> Out for Delivery -> Delivered) will show in the order details dialog
- When Steadfast reports "delivered", the order status auto-updates in the database

## 3. Future Payment Gateway Readiness

**Database preparation**: Add two new columns to the `orders` table:
- `payment_status` (text, default 'unpaid') -- for tracking payment state (unpaid, paid, refunded)
- `payment_reference` (text, nullable) -- for storing transaction IDs from future gateways

These columns will be displayed in the UI as a "Payment" column showing COD/bKash/etc. and payment status.

## 4. UI/UX Redesign (Inspired by Reference Images)

### Desktop Table Improvements
- Add Customer phone number column (like reference image 1)
- Add "Courier" column showing Steadfast status with tracking link
- Add "Payment" column showing method + status
- Wider table with better column distribution
- Three-dot menu with actions: View/Edit, Confirm, Track, Ship, Delete (like reference image 1)

### Mobile Card Improvements
- Compact card layout with customer name + phone prominently displayed
- Inline action buttons (Accept, Reject, Track) with touch-friendly 44px targets
- Tracking status badge visible at a glance

### Order Details Dialog Enhancement
- Add delivery tracking timeline section
- Add "Send to Courier" button directly in dialog for pending orders
- Show Steadfast courier balance in header (admin utility)

---

## Technical Details

### Database Migration
```sql
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text;
```

### Files to Create
1. **`src/components/admin/SendToCourierDialog.tsx`** -- New dialog replacing AcceptOrderDialog with one-click Steadfast integration
2. **`src/components/admin/OrderTrackingTimeline.tsx`** -- Visual tracking timeline component

### Files to Edit
1. **`src/pages/admin/AdminOrders.tsx`** -- Major UI overhaul with new columns, courier actions, tracking inline display
2. **`src/components/admin/AcceptOrderDialog.tsx`** -- Add "Quick Ship" mode that calls Steadfast API automatically
3. **`src/components/admin/OrderStatsBar.tsx`** -- Minor polish, ensure consistent with new design

### Edge Function Usage
- Uses existing `supabase/functions/steadfast/index.ts` -- no changes needed
- Actions used: `create_order` (ship), `track_by_consignment` (track), `get_balance` (admin info)

### Steadfast API Flow
```text
Admin clicks "Send to Courier"
  -> Frontend calls steadfast edge function with action: "create_order"
  -> Edge function calls Steadfast API with order details
  -> Returns tracking_code + consignment_id
  -> Frontend saves to orders table
  -> Order status updated to "processing"
  -> Real-time subscription pushes update to all connected clients
```

### Responsive Design
- Mobile: Card-based layout with swipeable actions, 44px touch targets
- Tablet: Compact table with essential columns
- Desktop: Full table with all columns visible

