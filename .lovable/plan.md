

# Visual Harmonization Plan -- Vetmedix Design System Alignment

## Vetmedix Design Rules (Source of Truth)

Based on the most polished pages (Admin Dashboard, Clinic Dashboard, Shop, Clinics/Doctors), these are the dominant tokens:

| Token | Standard | Notes |
|---|---|---|
| Card Radius | `rounded-xl sm:rounded-2xl` | Used by ClinicCard, Admin StatCard, Clinic Dashboard cards |
| Input Radius | `rounded-lg sm:rounded-xl` | Shop search, Clinic search, Navbar search |
| Button Radius | `rounded-xl` | Set globally via `buttonVariants` |
| Modal/Dialog Radius | `rounded-xl` | shadcn default |
| Card Shadow | `shadow-sm` resting, `shadow-md`/`shadow-xl` hover | Consistent across admin and clinic |
| Page Container | `container mx-auto px-3 sm:px-4 py-4 sm:py-6` | Clinic, Doctor, Feed, Shop all use this |
| Card Padding | `p-3 sm:p-4 lg:p-6` | Admin and Clinic stat cards |
| Page Background | `bg-background` or `bg-muted/30` or gradient | Varies per portal |
| Typography H1 | `text-xl sm:text-2xl lg:text-3xl font-bold` | Clinic and Doctor dashboards |
| Stat Card Layout | Icon top-left (gradient bg, rounded-xl), value below, label bottom | Clinic Dashboard pattern (the most polished) |
| Grid | `grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4` | Standard for stat cards |

## Deviations Found

### DEV-1: Doctor Dashboard Stat Cards -- Different Layout (Medium)
**File:** `src/pages/doctor/DoctorDashboard.tsx` (lines 215-238)

**Problem:** Doctor stat cards use a **side-by-side** layout (text left, circular icon right) while Clinic Dashboard uses a **stacked** layout (gradient icon top-left, value below). The Doctor cards also use `rounded-full` for icons instead of `rounded-xl sm:rounded-2xl`.

**Clinic standard (target):**
- Icon: top-left, `w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br`
- Value: below icon, `text-xl sm:text-2xl lg:text-3xl font-bold`
- Label: bottom, `text-[10px] sm:text-xs lg:text-sm text-muted-foreground`
- Card: `hover:shadow-xl hover:-translate-y-1 border-border/50 active:scale-[0.98]`

**Doctor current (deviant):**
- Icon: right side, `h-10 w-10 sm:h-12 sm:w-12 rounded-full`
- Value: left side next to icon, `text-xl sm:text-2xl font-bold`
- Card: `hover:shadow-md active:scale-[0.97]` (weaker hover effect)

**Fix:** Refactor Doctor Dashboard stat cards to match Clinic Dashboard stacked layout with gradient icon backgrounds.

---

### DEV-2: Doctor Dashboard Missing Hover Depth (Low)
**File:** `src/pages/doctor/DoctorDashboard.tsx` (line 222)

Cards use `hover:shadow-md` instead of the standard `hover:shadow-xl hover:-translate-y-1`. Also missing `border-border/50 bg-white` classes.

**Fix:** Update Card className to match: `transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 bg-white active:scale-[0.98]`

---

### DEV-3: Doctor Dashboard Page Header -- No Hero Section (Low)
**File:** `src/pages/doctor/DoctorDashboard.tsx` (lines 184-208)

The Doctor Dashboard uses a simple flex header (title left, buttons right) without any background card/gradient. The Clinic Dashboard wraps its header in a polished hero card: `bg-gradient-to-br from-white via-white to-primary/5 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 shadow-lg`.

**Fix:** Wrap the Doctor Dashboard welcome section in a styled hero card matching the Clinic Dashboard pattern, with avatar, name, date, verification badge, and action buttons.

---

### DEV-4: BlogArticlePage Uses `rounded-lg` Instead of `rounded-xl` (Low)
**File:** `src/pages/BlogArticlePage.tsx` (line 83)

Featured image container uses `rounded-lg` instead of the standard `rounded-xl`.

**Fix:** Change to `rounded-xl`.

---

### DEV-5: AdminProducts Inline Buttons Use `rounded-lg` (Low)
**File:** `src/pages/admin/AdminProducts.tsx` (lines 514-538)

Inline quick-edit buttons and stock input use `rounded-lg` instead of the global button standard `rounded-xl`. These are small inline action buttons so `rounded-lg` is acceptable at this scale, but for consistency they should use `rounded-xl`.

**Fix:** Change `rounded-lg` to `rounded-xl` on inline product action buttons and stock input.

---

## Summary of Changes

| File | Change | Severity |
|---|---|---|
| `DoctorDashboard.tsx` | Refactor stat cards to stacked layout (icon top, value below) matching Clinic Dashboard | Medium |
| `DoctorDashboard.tsx` | Add hero card wrapper around welcome section | Low |
| `DoctorDashboard.tsx` | Upgrade hover effects to `shadow-xl` + `translate-y` | Low |
| `BlogArticlePage.tsx` | `rounded-lg` to `rounded-xl` on featured image | Low |
| `AdminProducts.tsx` | `rounded-lg` to `rounded-xl` on inline buttons | Low |

**Total: 3 files, 5 changes. No database changes. No new dependencies.**

The highest-impact change is DEV-1 (Doctor Dashboard stat cards), which will bring the Doctor portal into visual parity with the Clinic and Admin portals.

## Technical Details

### DEV-1 Implementation (Doctor Stat Cards)
Replace the current `statCards.map` block (lines 216-238) with the Clinic Dashboard pattern:
- Each card gets `className={cn("cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 bg-white active:scale-[0.98]", activeTab === stat.tab && "ring-2 ring-primary shadow-xl")}`
- `CardContent` uses `p-3 sm:p-4 lg:p-6`
- Icon container: `w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br {colorGradient}`
- Value/label stacked below icon

### DEV-3 Implementation (Doctor Hero Card)
Wrap lines 185-208 in:
```
<div className="bg-gradient-to-br from-white via-white to-primary/5 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 shadow-lg shadow-black/5 border border-border/50 mb-4 sm:mb-6 lg:mb-8 relative overflow-hidden">
```
Add Doctor avatar, verification badge inline, and decorative accent circle (matching Clinic Dashboard).

