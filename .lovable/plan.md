
# Fix Stock Status Sync and Admin-Shop Connectivity

## Root Cause
The "Cat House (Ash Colour)" shows "Stock Out" despite having stock=10 because the `badge` field contains the literal text "Stock Out" from when it was originally out of stock. When the admin updated the stock number, this manual badge text was not automatically cleared.

## Changes

### 1. Auto-sync badge field with stock updates (`AdminProducts.tsx`)
When the admin updates stock via Quick Stock Update, automatically clear the "Stock Out" badge if the new stock is greater than 0. Conversely, if stock is set to 0, auto-set the badge to "Stock Out".

**In `handleQuickStockUpdate`**: After updating stock, also update the badge field:
- If newStock > 0 and current badge is "Stock Out" -> clear badge to null
- If newStock === 0 -> set badge to "Stock Out"

### 2. Fix ProductCard badge display (`ProductCard.tsx`)
Add a guard so the "Stock Out" badge text is never shown when stock > 0. This prevents stale badge data from misleading users regardless of the source.

**In ProductCard**: Filter out badge display when badge text is "Stock Out" and stock > 0.

### 3. Fix the existing data (SQL)
Run a one-time database update to clear "Stock Out" badges on all products that currently have stock > 0.

```
UPDATE products SET badge = NULL WHERE badge = 'Stock Out' AND stock > 0;
```

### 4. Auto-sync badge in product edit/save (`AdminProducts.tsx`)
When saving a product via the Add/Edit form, apply the same badge-stock sync logic:
- If stock > 0 and badge is "Stock Out", clear badge
- If stock is 0, set badge to "Stock Out"

## Technical Details

### Files to Edit
1. **`src/pages/admin/AdminProducts.tsx`** - Add badge auto-sync in `handleQuickStockUpdate`, `handleAdd`, and `handleEdit`
2. **`src/components/ProductCard.tsx`** - Guard against stale "Stock Out" badge when stock > 0
3. **Database migration** - One-time fix for existing stale data

### No new dependencies needed
This is purely logic fixes in existing files plus a data correction.
