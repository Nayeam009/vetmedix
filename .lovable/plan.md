

# Trash System for Orders and Incomplete Orders

## Overview
Add a soft-delete "Trash" system to both the **Orders** and **Incomplete Orders** pages. Admins can move orders to trash, view trashed items, and permanently delete them. The Orders page card design will also be improved to match the Incomplete Orders style.

## Database Changes

### 1. Add `trashed_at` column to both tables
- `orders` table: Add nullable `trashed_at` timestamp column
- `incomplete_orders` table: Add nullable `trashed_at` timestamp column
- When `trashed_at` is set, the order is "in trash". When null, it's active.

## Code Changes

### 2. Update `useIncompleteOrders.ts`
- Change `deleteOrder` to soft-delete (set `trashed_at = now()`) instead of hard-deleting
- Add `permanentlyDelete` mutation for trash
- Add `restoreOrder` mutation (set `trashed_at = null`)
- Add a `trashed` stat count
- Filter active vs trashed orders

### 3. Update `AdminIncompleteOrders.tsx`
- Add a "Trash" stat card alongside existing stats (Incomplete, Recovered, etc.)
- Clicking the Trash card toggles showing trashed items
- Trashed view shows "Restore" and "Delete Forever" buttons
- Active view shows "Move to Trash" (existing trash icon behavior)
- Add confirmation dialog for permanent deletion

### 4. Update `useAdmin.ts` / `useAdminOrders`
- Filter out trashed orders from default view (`trashed_at IS NULL`)
- Add `trashOrder` mutation (set `trashed_at = now()`)
- Add `permanentlyDeleteOrder` mutation
- Add `restoreOrder` mutation
- Add trashed count to stats

### 5. Update `AdminOrders.tsx`
- Add a "Trash" stat card in the OrderStatsBar area
- Add "Move to Trash" option in the dropdown menu for each order
- When trash filter is active, show trashed orders with "Restore" and "Delete Forever" actions
- Add confirmation dialog for permanent deletion
- **Improve mobile card design**: Match the clean card layout from Incomplete Orders (structured rows with icons, better spacing, touch-friendly targets)

### 6. Update `OrderStatsBar.tsx`
- Add a "Trashed" stat card with trash icon to the stats bar

## UI/UX Details

### Trash Card Design (both pages)
- Icon: Trash2 icon with red/muted color scheme
- Shows count of trashed items
- Acts as a toggle filter (like other stat cards)
- Active state: `ring-2 ring-primary`

### Trashed Items View
- Each trashed item shows a muted/faded appearance
- Two action buttons per item:
  - "Restore" (undo icon, outline style)
  - "Delete Forever" (trash icon, destructive style)
- Permanent delete requires confirmation dialog

### Orders Page Mobile Card Improvements
- Use structured rows matching Incomplete Orders layout
- Row 1: Order ID + Status badge
- Row 2: Customer name with icon + Total amount
- Row 3: Date + Items count + Payment badges
- Row 4: Tracking info (if available)
- Row 5: Action buttons with proper touch targets (h-11, rounded-xl)
- Add trash button alongside existing actions

## Files to Edit
1. **Database migration** - Add `trashed_at` to `orders` and `incomplete_orders`
2. `src/hooks/useIncompleteOrders.ts` - Soft delete, restore, permanent delete
3. `src/hooks/useAdmin.ts` - Add trash/restore/delete mutations for orders
4. `src/pages/admin/AdminIncompleteOrders.tsx` - Trash card, trash view, permanent delete dialog
5. `src/pages/admin/AdminOrders.tsx` - Trash card, trash actions, improved mobile cards
6. `src/components/admin/OrderStatsBar.tsx` - Add trashed stat

