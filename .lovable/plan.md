

# Fraud Order Detection System

## Problem

Currently, the admin has no way to identify potentially fraudulent orders before accepting them. Looking at actual order data, there are clear fraud signals that go unnoticed:

- Order from "Sakib" with gibberish address "Bdhdndnd, Behjd, Hdhd, Hdhd" and invalid phone "0273+39"
- Same user placing duplicate orders 3 minutes apart (same items, same address)
- Shipping name different from profile name (profile says "Admin" but order says "Test User")
- All orders are Cash on Delivery (highest fraud risk payment method)

Without detection, the admin wastes time processing fake orders and risks shipping products that will never be paid for.

---

## Solution Overview

A client-side fraud scoring engine that automatically analyzes every order against multiple risk signals, assigns a risk level (Low / Medium / High), and surfaces flagged orders prominently so the admin can prioritize review.

No AI or external APIs needed -- this uses rule-based heuristics on data already available in the database.

---

## Fraud Signals to Detect

| Signal | What It Catches | Risk Points |
|--------|----------------|-------------|
| Gibberish address | Random keyboard characters, repeated chars, too-short fields | +30 |
| Invalid phone | Not matching Bangladesh format (01XXXXXXXXX, 11 digits) | +25 |
| Name mismatch | Shipping name differs from profile name | +15 |
| Rapid repeat orders | Same user placed another order within 1 hour | +20 |
| High cancellation rate | User has >50% cancelled orders historically | +15 |
| Suspicious address length | Address fields under 3 characters | +20 |
| Very high first order | New user's first order exceeds a threshold (e.g., 5000 BDT) | +10 |

**Risk Levels:**
- 0-19 points: Low risk (green)
- 20-39 points: Medium risk (yellow/amber)
- 40+ points: High risk (red)

---

## What the Admin Sees

### 1. Risk Badge on Every Order
Each order in both the mobile card view and desktop table gets a small colored badge:
- Green shield icon = Low Risk
- Amber warning icon = Medium Risk  
- Red alert icon = High Risk

### 2. "Flagged" Quick Filter
A new filter option alongside the existing status filter that shows only Medium and High risk orders, so the admin can review suspicious orders first.

### 3. Fraud Details in Order Dialog
When viewing order details, a new "Risk Analysis" section appears showing:
- Overall risk score and level
- Each triggered signal with a short explanation (e.g., "Phone number format invalid: 0273+39")
- Recommendation text (e.g., "Review carefully before accepting" or "Consider rejecting")

### 4. Risk Summary in Order Stats
If there are any high-risk pending orders, show a count at the top of the page as an alert.

---

## Technical Details

### New Files

1. **`src/lib/fraudDetection.ts`** -- Core fraud scoring engine
   - `analyzeFraudRisk(order, profile, userOrders)` function
   - Returns `{ score: number, level: 'low' | 'medium' | 'high', signals: FraudSignal[] }`
   - Contains all heuristic functions:
     - `isGibberishText(text)` -- detects random character sequences (consonant clusters, repeated chars)
     - `isValidBDPhone(phone)` -- validates Bangladesh phone format
     - `parseShippingAddress(address)` -- extracts name, phone, and address parts from the concatenated string
     - `checkNameMismatch(shippingName, profileName)` -- fuzzy comparison
     - `checkRapidOrders(orders, currentOrder)` -- finds orders within 1 hour window
     - `checkCancellationRate(orders)` -- calculates historical cancel percentage

2. **`src/components/admin/FraudRiskBadge.tsx`** -- Visual risk indicator component
   - Compact badge with icon + color for table/card views
   - Tooltip showing brief risk summary on hover

3. **`src/components/admin/FraudAnalysisPanel.tsx`** -- Detailed risk breakdown panel
   - Used inside the Order Details dialog
   - Shows each triggered signal with icon, description, and point value
   - Shows overall score with progress bar visualization
   - Recommendation text based on risk level

### Modified Files

1. **`src/hooks/useAdmin.ts`** -- Update `useAdminOrders` hook
   - Join `profiles` table to get `full_name` and `phone` for name-mismatch detection
   - The query becomes: `supabase.from('orders').select('*, profile:profiles!user_id(full_name, phone)')` 

2. **`src/pages/admin/AdminOrders.tsx`** -- Integrate fraud detection
   - Import and run `analyzeFraudRisk` on each order when data loads (memoized)
   - Add "Risk" column to desktop table (between Status and Actions)
   - Add `FraudRiskBadge` to mobile card view
   - Add "Flagged" option to the status filter dropdown
   - Add `FraudAnalysisPanel` inside the Order Details dialog
   - Show alert banner if high-risk pending orders exist

### No Database Changes Required

All fraud analysis runs client-side using existing order data, profile data, and order history. No new tables, columns, or migrations needed.

### Performance Considerations

- Fraud analysis is computed via `useMemo` -- only recalculates when orders data changes
- The gibberish detection uses lightweight string analysis (character frequency, consonant clusters), not external API calls
- Profile data is fetched in the same query as orders (single round-trip)

