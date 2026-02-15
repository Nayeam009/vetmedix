
# Enhanced Admin Products Page & Category Management

## Overview
Upgrade the admin products page with an improved product form (inspired by reference screenshots), add a dynamic category system with a management dialog, and add active/featured toggle columns to the product table.

---

## 1. Database Changes

### New `product_categories` Table
A dedicated table to manage product categories dynamically instead of hardcoding "Pet" and "Farm":

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Category display name (e.g., "Pet", "Farm") |
| slug | text | URL-friendly identifier |
| image_url | text | Optional category image |
| product_count | integer | Auto-updated count |
| is_active | boolean | Toggle visibility |
| created_at | timestamptz | Timestamp |

RLS: Admins full CRUD, everyone can read active categories.

### Products Table Updates
Add new columns to the `products` table:

| Column | Type | Notes |
|--------|------|-------|
| is_active | boolean | Default true - toggle product visibility |
| is_featured | boolean | Default false - mark as featured |
| compare_price | numeric | Original price before discount (for showing strikethrough) |
| sku | text | Stock Keeping Unit identifier |

---

## 2. Product Form Enhancement (`ProductFormFields.tsx`)

Redesign into organized sections inspired by image 134:

**Section 1 - Basic Information (left/main column on desktop):**
- Name
- Description (textarea)
- Image upload (existing component)

**Section 2 - Price and Stock (right sidebar on desktop, stacked on mobile):**
- Regular Price (BDT)
- Compare Price (BDT) - the "was" price for showing discounts
- Stock Quantity
- SKU (optional)
- Discount %

**Section 3 - Organization:**
- Category (dropdown from `product_categories` table, with "+ New Category" option inline)
- Product Type (text input)
- Badge (text input)

**Section 4 - Status:**
- Active toggle (Switch component)
- Featured toggle (Switch component)

On mobile: single column, all sections stacked. On desktop: two-column layout (main content left, sidebar right) within the dialog.

---

## 3. Category Management

### "Manage Categories" Button
Add a button in the product page header actions area (next to Import/Export and Add Product).

### Category Management Dialog
A dialog/sheet with:
- List of all categories showing: name, slug, product count, active toggle
- "Add New Category" button at top
- Inline editing for category name and active status
- Delete option (with confirmation if products exist in category)
- Mobile-friendly card layout

---

## 4. Product Table Enhancements

### Desktop Table Updates
Add new columns inspired by image 133:
- **Price column**: Show compare_price with strikethrough next to actual price
- **Active column**: Toggle switch to quickly enable/disable products inline
- **Featured column**: Toggle switch for featured status (optional, can be in dropdown)

### Mobile Card Updates
- Show active/inactive badge on cards
- Show compare price with strikethrough styling

---

## 5. Form Data Updates

Update `ProductFormData` interface to include new fields:
```
is_active: boolean
is_featured: boolean
compare_price: string
sku: string
```

Update the `productFormSchema` in `validations.ts` to include validation for new fields.

---

## Technical Details

### Files to Create
1. `src/hooks/useProductCategories.ts` - Hook for fetching/managing categories with realtime

### Files to Edit
1. `src/components/admin/ProductFormFields.tsx` - Enhanced form with sections, category dropdown, toggles, new fields
2. `src/pages/admin/AdminProducts.tsx` - Add category management button/dialog, update table columns, update form data handling
3. `src/lib/validations.ts` - Add new field validations to productFormSchema
4. `src/types/database.ts` - Update Product interface with new fields

### Database Migration
```sql
-- New categories table
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  image_url text,
  product_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories"
  ON public.product_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories"
  ON public.product_categories FOR SELECT
  USING (is_active = true);

-- Seed existing categories
INSERT INTO public.product_categories (name, slug) VALUES
  ('Pet', 'pet'),
  ('Farm', 'farm');

-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS compare_price numeric,
  ADD COLUMN IF NOT EXISTS sku text;

-- Enable realtime for categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_categories;
```

### Responsive Design
- Product form: Single column on mobile, two-column layout on desktop within dialog
- Category dialog: Card layout on mobile, table on desktop
- Toggle switches: 44px touch targets on mobile
- All new inputs use rounded-xl styling consistent with existing UI
