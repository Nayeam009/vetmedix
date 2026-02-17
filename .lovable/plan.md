

# Polish Coupons Page Stat Cards to Match Platform Design

## Problem
The Coupons page stat cards use a custom layout that doesn't match the unified design pattern used across Orders, Products, and other admin pages. The text and numbers are hard to read compared to those other pages.

## What Changes

### Redesign Coupons Stats Bar
**File**: `src/pages/admin/AdminCoupons.tsx`

Replace the current inline stats section (lines ~175-196) with the same button-based card pattern used by `OrderStatsBar` and `ProductStatsBar`:

**Current (hard to read)**:
- Icon and text stacked vertically inside a flex container
- Different sizing and spacing from other pages

**New (matching platform standard)**:
- Horizontal scrollable row of `button` cards
- Each card: `[icon circle] [bold number + label below]`
- Same classes: `rounded-xl sm:rounded-2xl`, `px-3 py-2.5 sm:px-4 sm:py-3`, `min-w-[100px] sm:min-w-[120px]`
- Same font: `text-base sm:text-lg lg:text-xl font-display font-bold`
- Same label: `text-[10px] sm:text-xs text-muted-foreground`
- Same icon container: `h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl`
- Colored number values matching each stat's theme (primary for Total, emerald for Active, red for Expired, amber for Used Up)
- Active state with `ring-2` highlight when filtering

### Color Mapping
| Stat | Icon | Number Color | Icon BG Gradient |
|------|------|-------------|-----------------|
| Total | Ticket | text-foreground | from-primary/10 to-accent/10 |
| Active | ToggleRight | text-emerald-700 | from-emerald-500/10 to-green-500/10 |
| Expired | ToggleLeft | text-red-700 | from-red-500/10 to-rose-500/10 |
| Used Up | Check | text-amber-700 | from-amber-500/10 to-orange-500/10 |

## Technical Details

Replace the stats `div` block with a standardized scrollable row using the exact same class pattern from `ProductStatsBar.tsx`. No new components needed -- just align the existing inline JSX to the proven pattern.

### File to Edit
1. `src/pages/admin/AdminCoupons.tsx` - Stats bar section only

