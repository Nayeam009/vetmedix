

# Shop Page Rearrangement, Grid Optimization & E-Commerce Testing

## Current Layout (Order)
1. Hero Banner with carousel
2. Featured Products section
3. Search/Filter/Sort bar
4. Active filters display
5. All Products grid
6. Recently Viewed

## New Layout (Requested Order)
1. Hero Banner (keep existing, compact)
2. Search/Filter/Sort bar (moved up)
3. Featured Products section
4. All Products grid
5. Recently Viewed

## Changes

### 1. ShopPage.tsx - Rearrange Sections
- Move the search/filter/sort bar (`bg-background rounded-xl` block, lines 397-633) to render **above** the Featured Products section (lines 368-395)
- This means: Hero -> Search Bar -> Featured -> All Products -> Recently Viewed

### 2. ShopPage.tsx - Update Grid Columns
- **Large screens (xl+)**: 6 columns per row
- **Desktop (lg)**: 4-5 columns
- **Tablet (md)**: 3 columns
- **Mobile**: 3 columns (changed from 2)
- Update the grid class logic for all grid views:
  - Default grid: `grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6`
  - Grid toggle options updated to support 3/4/6 column presets
  - Featured products grid: `grid-cols-3 lg:grid-cols-4 xl:grid-cols-6`
  - Loading skeleton grid: same responsive pattern
  - Popular products fallback: same pattern

### 3. ProductCard.tsx - Optimize for 3-col mobile & 6-col desktop
- Reduce padding slightly for tighter fit on mobile 3-col layout
- Ensure text truncation and button sizing works at smaller card widths
- Adjust font sizes: smaller on mobile for 3-col fit
- Reduce min-height on title to accommodate compact layout

### 4. ShopPage.tsx - Update gridCols state
- Change default from `3` to `4` (since 6 is now the max)
- Update grid toggle buttons: options become 3, 4, 6 (instead of 2, 3, 4)
- Update corresponding grid class mapping

## Technical Details

### Grid Class Mapping (Updated)
```typescript
// gridCols state: 3 | 4 | 6
const gridClass = gridCols === 3
  ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-3'
  : gridCols === 4
    ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
```

### ProductCard Compact Adjustments
- Padding: `p-2 sm:p-2.5` (from `p-2.5 sm:p-4`)
- Title font: `text-[10px] sm:text-xs` (from `text-xs sm:text-sm`)
- Price font: `text-sm sm:text-lg` (from `text-base sm:text-xl`)
- Button height: `h-7 sm:h-9` (from `h-8 sm:h-10`)
- Min-height title: reduced for compact layout

### Files to Edit
- `src/pages/ShopPage.tsx` - Rearrange sections, update grid logic
- `src/components/ProductCard.tsx` - Optimize sizing for compact layouts

### No Database Changes Needed

