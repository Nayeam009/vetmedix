

# Admin Sidebar Breakpoint Refinement

## Problem

The admin panel currently uses the `lg` breakpoint (1024px) as the threshold between mobile (hamburger + Sheet drawer) and desktop (fixed collapsible sidebar). This means tablets (768-1023px) unnecessarily show the mobile hamburger menu instead of the full sidebar, wasting screen real estate.

## Solution

Shift the responsive threshold from `lg` (1024px) down to `md` (768px) so tablets get the fixed sidebar. This is a pure CSS class swap -- no logic, component, or database changes needed.

## What Changes

| Viewport | Current Behavior | After Fix |
|----------|-----------------|-----------|
| Below 768px | Hamburger + Sheet | Hamburger + Sheet (no change) |
| 768px - 1023px | Hamburger + Sheet | Fixed collapsible sidebar |
| 1024px and above | Fixed collapsible sidebar | Fixed collapsible sidebar (no change) |

## Files to Edit (3)

### 1. `src/components/admin/AdminSidebar.tsx`
- Line 120: Change `hidden lg:flex` to `hidden md:flex` on the `<aside>` element
- This makes the fixed sidebar visible starting at 768px

### 2. `src/components/admin/AdminHeader.tsx`
Five class swaps:
- Line 62: Hamburger trigger `lg:hidden` to `md:hidden` (hide on tablet+)
- Line 85: Desktop toggle button `hidden lg:flex` to `hidden md:flex` (show on tablet+)
- Line 97: Mobile logo `lg:hidden` to `md:hidden` (hide on tablet+)
- Line 114: Desktop page title `hidden lg:block` to `hidden md:block` (show on tablet+)
- Line 121: Mobile page title `lg:hidden` to `md:hidden` (hide on tablet+)

### 3. `src/components/admin/AdminLayout.tsx`
- Line 68: Content margin from `lg:ml-[72px]` / `lg:ml-[260px]` to `md:ml-[72px]` / `md:ml-[260px]`
- This ensures the main content correctly offsets from the sidebar at the new breakpoint

## What Stays the Same

- The `AdminMobileNav` component (Sheet content) -- untouched, still used below 768px
- The `AdminSidebar` component logic (collapsible, tooltips, badges) -- untouched
- All navigation items, sections, and badge logic -- untouched
- The Sheet auto-close behavior via `SheetClose` -- already working correctly
- The sidebar's `z-50` ensures it layers above all content

## Technical Notes

- Total changes: 7 Tailwind class prefix swaps (`lg:` to `md:`)
- Zero new components, zero new dependencies, zero database changes
- The existing `md:flex` search bar in the header (line 127) already aligns with this breakpoint, so the layout will be fully consistent

