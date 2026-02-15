
# Delivery Zones + Coupon Improvements

## Overview
Create a new **Delivery Zones** admin page that allows the admin to define delivery zones with custom pricing, estimated delivery times, and active/inactive toggles. These zones will auto-sync with the checkout page, replacing the current hardcoded Dhaka/Outside Dhaka delivery charge logic. The coupon system will also be added to the sidebar (it's currently missing from mobile nav).

---

## 1. New Database Table: `delivery_zones`

Create a `delivery_zones` table to store zone-based delivery pricing:

```sql
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  charge NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT DEFAULT '3-5 days',
  is_active BOOLEAN DEFAULT true,
  divisions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admins manage, anyone can read active zones
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage delivery zones" ON delivery_zones FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active delivery zones" ON delivery_zones FOR SELECT USING (is_active = true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_zones;
```

Key fields:
- **zone_name**: e.g. "Dhaka Inside", "Dhaka Outside"
- **charge**: the delivery charge amount in BDT
- **delivery_fee**: alias/secondary fee field (can match charge)
- **estimated_days**: e.g. "3 days", "5-7 days"
- **is_active**: toggle on/off
- **divisions**: array of division names that belong to this zone (e.g. `["Dhaka"]` or `["Rajshahi", "Rangpur"]`)

## 2. New Admin Page: `AdminDeliveryZones.tsx`

Route: `/admin/delivery-zones`

Inspired by the reference screenshot, this page will have:
- **Header**: "Delivery Zones" with subtitle showing zone count
- **Add Zone button**: Opens a dialog/form
- **Table view** with columns: Zone Name, Charge (BDT), Delivery Fee (BDT), Estimated Days, Status (toggle), Actions (edit/delete)
- **Form fields**: Zone Name, Divisions (multi-select from Bangladesh divisions list), Charge, Delivery Fee, Estimated Days, Active toggle
- **Realtime subscription** on `delivery_zones` table for instant updates
- Mobile-responsive card layout

Follows existing admin page patterns (similar to AdminCoupons structure).

## 3. Update Checkout Delivery Charge Logic

**Current**: Hardcoded `getDeliveryCharge()` function returns 60 for Dhaka, 120 for others.

**New**: Query `delivery_zones` table, match the customer's selected division against zone `divisions` arrays, and use the zone's charge. Falls back to a default (e.g. 120) if no zone matches.

Changes in `CheckoutPage.tsx`:
- Add a React Query hook to fetch active delivery zones
- Replace `getDeliveryCharge(division)` with a function that looks up the matching zone
- Display the zone name and estimated delivery time in the delivery info section
- If a "free_delivery" coupon is applied, it still overrides the zone charge to 0

## 4. Update Sidebar & Mobile Nav

Add "Delivery Zones" to the E-Commerce section in both:
- `AdminSidebar.tsx` -- add entry with `MapPin` icon after Coupons
- `AdminMobileNav.tsx` -- add matching entry with description "Zone pricing"
- Also add the missing "Coupons" entry to mobile nav

## 5. Add Route in `App.tsx`

- Lazy import `AdminDeliveryZones`
- Route: `/admin/delivery-zones`

---

## Technical Details

### Files to Create
1. **`src/pages/admin/AdminDeliveryZones.tsx`** -- Full CRUD page following AdminCoupons pattern

### Files to Edit
2. **`src/pages/CheckoutPage.tsx`** -- Replace hardcoded delivery charge with zone-based lookup
3. **`src/components/admin/AdminSidebar.tsx`** -- Add Delivery Zones nav item + MapPin icon import
4. **`src/components/admin/AdminMobileNav.tsx`** -- Add Delivery Zones + Coupons nav items
5. **`src/App.tsx`** -- Add lazy import and route

### Database Migration
- Create `delivery_zones` table with RLS policies
- Seed two default zones: "Dhaka Inside" (charge 60, divisions: ["Dhaka"]) and "Outside Dhaka" (charge 120, divisions: all other 7 divisions)

### Checkout Integration Logic
```text
1. Fetch active delivery_zones on checkout page load
2. When user selects division:
   - Find zone where divisions array contains the selected division
   - Use that zone's charge as delivery fee
   - Display zone name + estimated_days
3. If no matching zone found, use fallback charge of 120
4. Free delivery coupon still overrides to 0
```

### No Breaking Changes
The hardcoded logic is replaced seamlessly. The seeded default zones match the current pricing (Dhaka=60, others=120), so existing behavior is preserved until the admin changes zone settings.
