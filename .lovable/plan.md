

# E-Commerce Shop Improvements Plan

## What You Already Have (Working Well)
- Product listing with search, filters, sorting, and pagination
- Product detail page with reviews, ratings, gallery, and buy box
- Cart with quantity management and delivery cost calculation
- Checkout with address form, coupon support, and stock validation
- Order tracking with Steadfast integration
- Wishlist system
- Admin product/order/coupon management

## Missing Features to Complete the Shop

### 1. "Out of Stock" Handling on Product Cards and Detail Page
Currently, products with `stock = 0` show no visual indication and the "Add to Cart" button still works. This needs:
- Show a "Stock Out" overlay/badge on ProductCard when stock is 0
- Disable the "Add to Cart" button on both the card and the detail page
- Show stock quantity warning (e.g., "Only 3 left!") for low-stock items

### 2. "Recently Viewed" Products Section
No browsing history is tracked. Adding a "Recently Viewed" section on the Shop page and Product Detail page helps users find products they previously browsed. This uses localStorage (no database needed).

### 3. Product Rating Display on Cards
The ProductCard currently shows no rating. Since the reviews table already has data, we should display the average rating and review count directly on each card. This requires fetching aggregated review data alongside products.

### 4. "Sort by Rating" and "Sort by Best Selling" Options
The sort dropdown is missing popularity-based sorts. Adding "Top Rated" and "Best Selling" (based on order history) would help users discover quality products.

### 5. Empty Search Results with Suggestions
When a search returns no results, the page shows a plain "No products found" message. This should include:
- Clear the search suggestion
- Show popular/trending products as alternatives
- Spelling correction hints

### 6. Quantity Selector on Product Cards
Users must visit the detail page just to add more than 1 item. A small quantity stepper on the card would reduce friction for repeat buyers.

### 7. "Buy Now" Button on Product Detail
Currently only "Add to Cart" exists. A "Buy Now" button that adds the item and immediately navigates to checkout would streamline single-item purchases.

### 8. Order Confirmation Email / Summary
After checkout, the success screen is minimal. Adding order details (order ID, items summary, estimated delivery) to the confirmation screen makes it more professional.

---

## Technical Implementation Details

### Files to Modify
- `src/components/ProductCard.tsx` -- Add stock check, rating display, disable out-of-stock
- `src/pages/ProductDetailPage.tsx` -- Add "Buy Now" button, low stock warning, recently viewed tracking
- `src/pages/ShopPage.tsx` -- Add recently viewed section, improve empty state, add sort options
- `src/pages/CheckoutPage.tsx` -- Enhance order confirmation screen with order details

### Files to Create
- `src/hooks/useRecentlyViewed.ts` -- localStorage-based recently viewed products hook
- `src/hooks/useProductRatings.ts` -- Hook to fetch aggregated ratings for product lists

### Database Changes
- None required. All features use existing `products`, `reviews`, and `orders` tables.
- One new database query: aggregate review ratings per product (can be done via a Supabase view or client-side join).

### Performance Considerations
- Product ratings will be fetched in a single batch query rather than per-card to avoid N+1 queries
- Recently viewed uses localStorage with a max of 10 items to keep it lightweight
- Stock status is already available in the products query, just needs UI integration

