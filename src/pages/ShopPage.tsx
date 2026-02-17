import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Loader2, SlidersHorizontal, Grid3X3, LayoutGrid, Package, ChevronDown, X, Sparkles, ShoppingCart, Heart, Star, Clock, ChevronLeft, ChevronRight, Truck, Shield, Tag } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useProductRatings } from '@/hooks/useProductRatings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import SEO from '@/components/SEO';

// Price range options outside component to prevent recreation
const priceRangeOptions = [
  { value: 'all', label: 'All Prices' },
  { value: 'under500', label: 'Under ৳500' },
  { value: '500to1000', label: '৳500 - ৳1000' },
  { value: 'over1000', label: 'Over ৳1000' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
  { value: 'top-rated', label: 'Top Rated' },
];

// Category is now based on product_type, no more Pet/Farm distinction

const PRODUCTS_PER_PAGE = 20;

// Product type from database
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  product_type: string | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  stock: number | null;
  badge: string | null;
  discount: number | null;
  created_at: string;
  is_featured: boolean | null;
  is_active: boolean | null;
  compare_price: number | null;
  sku: string | null;
}

// Hero Carousel Component
const HeroCarousel = memo(({ products }: { products: Product[] }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  
  // Pick featured products: prioritize admin-marked featured, fallback to discounted
  const featured = useMemo(() => {
    const adminFeatured = products.filter(p => p.is_featured && p.is_active !== false && p.image_url);
    if (adminFeatured.length > 0) return adminFeatured.slice(0, 8);
    const discounted = products.filter(p => p.discount && p.discount > 0 && p.image_url && p.is_active !== false);
    const pool = discounted.length >= 5 ? discounted : products.filter(p => p.image_url && p.is_active !== false);
    return pool.slice(0, 5);
  }, [products]);

  useEffect(() => {
    if (featured.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % featured.length);
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % featured.length);
    }, 3500);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const p = featured[current];
  const discountedPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
  const strikethroughPrice = p.compare_price || (p.discount ? p.price : null);

  return (
    <div className="flex gap-3 sm:gap-4 items-center">
      {/* Main Featured Card */}
      <Link 
        to={`/product/${p.id}`}
        className="relative w-[200px] sm:w-[240px] lg:w-[260px] bg-background rounded-2xl border border-border shadow-card overflow-hidden group transition-all hover:shadow-hover"
      >
        <div className="aspect-square overflow-hidden bg-secondary/20">
          <img
            src={p.image_url || ''}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="eager"
            decoding="async"
            width={260}
            height={260}
          />
          {p.discount && (
            <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
              {p.discount}% OFF
            </span>
          )}
          {p.is_featured && (
            <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{p.name}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-primary">৳{discountedPrice.toLocaleString()}</span>
            {strikethroughPrice && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">৳{strikethroughPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Dots */}
      <div className="flex flex-col gap-1.5 lg:gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === current 
                ? 'w-2.5 h-2.5 bg-primary' 
                : 'w-2 h-2 bg-border hover:bg-muted-foreground/40'
            }`}
            aria-label={`Show product ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
});
HeroCarousel.displayName = 'HeroCarousel';

const ShopPage = () => {
  useDocumentTitle('Pet Shop');
  const { totalItems } = useCart();
  const { wishlistIds } = useWishlist();
  const { recentProducts } = useRecentlyViewed();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [productType, setProductType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4);
  const [priceRange, setPriceRange] = useState<'all' | 'under500' | '500to1000' | 'over1000'>('all');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  // React Query for products
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, name, price, category, product_type, description, image_url, images, stock, badge, discount, created_at, is_featured, is_active, compare_price, sku');
      if (error) throw error;
      return (data || []) as Product[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Realtime subscription for products
  useEffect(() => {
    const channel = supabase
      .channel('public-products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['public-products'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Extract unique categories for filter chips
  const productTypes = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));

  // Batch fetch ratings for all loaded products
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const ratings = useProductRatings(productIds);

  // Featured products for dedicated section
  const featuredProducts = useMemo(() => 
    products.filter(p => p.is_featured && p.is_active !== false),
    [products]
  );

  // Filter and sort products - exclude inactive
  let filteredProducts = products.filter(p => 
    p.is_active !== false && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Category filter
  if (productType !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.category === productType);
  }

  // Price filter
  if (priceRange !== 'all') {
    filteredProducts = filteredProducts.filter(p => {
      const price = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
      if (priceRange === 'under500') return price < 500;
      if (priceRange === '500to1000') return price >= 500 && price <= 1000;
      if (priceRange === 'over1000') return price > 1000;
      return true;
    });
  }

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discount ? Math.round(a.price * (1 - a.discount / 100)) : a.price;
    const priceB = b.discount ? Math.round(b.price * (1 - b.discount / 100)) : b.price;
    
    switch (sortBy) {
      case 'price-low': return priceA - priceB;
      case 'price-high': return priceB - priceA;
      case 'name': return a.name.localeCompare(b.name);
      case 'discount': return (b.discount || 0) - (a.discount || 0);
      case 'top-rated': {
        const rA = ratings[a.id]?.avgRating || 0;
        const rB = ratings[b.id]?.avgRating || 0;
        return rB - rA;
      }
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const activeFiltersCount = [
    productType !== 'All',
    priceRange !== 'all',
    searchQuery.length > 0
  ].filter(Boolean).length;

  // Reset visible count when filters change
  const paginatedProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;

  const clearFilters = useCallback(() => {
    setProductType('All');
    setPriceRange('all');
    setSearchQuery('');
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <SEO 
        title="Pet Shop - Premium Pet & Farm Supplies"
        description="Shop premium pet supplies, food, medicine, grooming tools, and farm animal products. Free delivery on orders over ৳2000 in Bangladesh."
        url="https://vetmedix.lovable.app/shop"
        schema={{ type: 'Organization', name: 'VetMedix Shop', url: 'https://vetmedix.lovable.app/shop', description: 'Premium pet and farm supplies in Bangladesh' }}
      />
      <Navbar />
      
      {/* Hero Banner with Sliding Images */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
        {/* Sliding Images Background - hidden on small mobile for performance */}
        <div className="absolute inset-0 overflow-hidden hidden sm:block">
          <div className="absolute inset-0 flex animate-[shop-slide_20s_linear_infinite]" style={{ width: '200%' }}>
            {[
              '/products/cat-carrier.jpg',
              '/products/grooming-set.jpg', 
              '/products/pet-balls.jpg',
              '/products/cat-house.jpg',
              '/products/feeding-bowl.jpg',
              '/products/pet-collar.jpg',
              '/products/winter-dress.jpg',
              '/products/cat-teaser-toy.jpg',
            ].map((src, i) => (
              <div key={i} className="flex-shrink-0 w-[12.5%] h-full relative">
                <img
                  src={src}
                  alt=""
                  loading={i < 4 ? "eager" : "lazy"}
                  className="w-full h-full object-cover opacity-[0.08]"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="relative container mx-auto px-4 py-4 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            {/* Left: Title & Features */}
            <div className="space-y-2 sm:space-y-4 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full">
                  <Tag className="h-3 w-3" />
                  Special Offers
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                Premium Pet & Farm
                <span className="block text-primary">Supplies</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-base max-w-md hidden sm:block">
                Quality products for your beloved pets and farm animals. Fast delivery across Bangladesh.
              </p>
              {/* Feature Pills */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm border border-border rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                  <Truck className="h-3 w-3 text-primary" /> Free ৳500+
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm border border-border rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                  <Shield className="h-3 w-3 text-accent" /> Authentic
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm border border-border rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                  <Package className="h-3 w-3 text-primary" /> {sortedProducts.length} Items
                </span>
              </div>
            </div>

            {/* Right: Featured Product Carousel - hidden on very small screens */}
            <div className="hidden sm:block relative w-auto flex-shrink-0">
              <HeroCarousel products={products} />
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6" role="main" aria-label="Shop products">
        {/* Search, Filter & Sort Bar */}
        <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Row */}
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-10 sm:h-11 pl-9 sm:pl-11 pr-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-base md:text-sm transition-all"
                  aria-label="Search products"
                />
                {searchQuery && (
                  <button 
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              
              {/* Cart Button */}
              <Link to="/cart" className="relative">
                <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl" aria-label={`Cart${totalItems > 0 ? ` (${totalItems} items)` : ''}`}>
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Wishlist Button */}
              <Link to="/wishlist" className="relative">
                <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl" aria-label={`Wishlist${wishlistIds.size > 0 ? ` (${wishlistIds.size} items)` : ''}`}>
                  <Heart className={`h-4 w-4 ${wishlistIds.size > 0 ? 'fill-destructive text-destructive' : ''}`} aria-hidden="true" />
                  {wishlistIds.size > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                      {wishlistIds.size}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:hidden h-10 w-10 relative" aria-label={`Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ''}`}>
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center" aria-hidden="true">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
                  <SheetHeader className="text-left">
                    <SheetTitle>Filters & Sort</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Product Type Filter */}
                    {productTypes.length > 2 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground" id="mobile-type-label">Category</h3>
                        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="mobile-type-label">
                          {productTypes.map(type => (
                            <button
                              key={type}
                              onClick={() => { setProductType(type); setVisibleCount(PRODUCTS_PER_PAGE); }}
                              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                                productType === type
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                              aria-pressed={productType === type}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {/* Price Range Filter */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground" id="mobile-price-label">Price Range</h3>
                      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="mobile-price-label">
                        {priceRangeOptions.map(option => (
                          <button 
                            key={option.value} 
                            onClick={() => setPriceRange(option.value as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                              priceRange === option.value 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={priceRange === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Sort Options */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground" id="mobile-sort-label">Sort By</h3>
                      <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="mobile-sort-label">
                        {sortOptions.map(option => (
                          <button 
                            key={option.value} 
                            onClick={() => setSortBy(option.value)}
                            className={`px-4 py-3 text-sm font-medium rounded-xl transition-all text-left ${
                              sortBy === option.value 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            aria-pressed={sortBy === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" onClick={clearFilters} className="w-full">
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Filters Row */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              {/* Left: Category & Price Dropdowns */}
              <div className="flex items-center gap-2">
                {/* Category (Product Type) Dropdown */}
                <Select value={productType} onValueChange={(v) => { setProductType(v); setVisibleCount(PRODUCTS_PER_PAGE); }}>
                  <SelectTrigger className="w-[160px] h-10 rounded-lg" aria-label="Category filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map(type => (
                      <SelectItem key={type} value={type}>{type === 'All' ? 'All Categories' : type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Price Range Select */}
                <Select value={priceRange} onValueChange={(v: any) => setPriceRange(v)}>
                  <SelectTrigger className="w-[150px] h-10 rounded-lg" aria-label="Price range filter">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRangeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground" aria-label="Clear all filters">
                    Clear filters
                    <X className="h-3 w-3 ml-1" aria-hidden="true" />
                  </Button>
                )}
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-3">
                {/* Sort Select */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-10 rounded-lg" aria-label="Sort products">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="discount">Best Discount</SelectItem>
                    <SelectItem value="top-rated">Top Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* Grid View Toggle */}
                <div className="hidden lg:flex items-center bg-muted/50 rounded-lg p-1 border border-border" role="group" aria-label="Grid view options">
                  <button
                    onClick={() => setGridCols(3)}
                    className={`p-2 rounded transition-all ${gridCols === 3 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                    aria-label="View as 3 columns"
                    aria-pressed={gridCols === 3}
                  >
                    <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`p-2 rounded transition-all ${gridCols === 4 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                    aria-label="View as 4 columns"
                    aria-pressed={gridCols === 4}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setGridCols(6)}
                    className={`p-2 rounded transition-all ${gridCols === 6 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                    aria-label="View as 6 columns"
                    aria-pressed={gridCols === 6}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="0.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="3.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="6.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="9.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="12.5" y="1" width="2" height="3" rx="0.5" />
                      <rect x="0.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="3.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="6.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="9.5" y="5" width="2" height="3" rx="0.5" />
                      <rect x="12.5" y="5" width="2" height="3" rx="0.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="mb-4 sm:mb-6" aria-label="Featured products">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Featured Products</h2>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1 snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:overflow-visible sm:snap-none">
              {featuredProducts.map(product => (
                <div key={product.id} className="flex-shrink-0 w-[130px] sm:w-auto snap-start">
                  <ProductCard 
                    id={product.id} 
                    name={product.name} 
                    price={product.price}
                    category={product.category} 
                    image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'}
                    badge={product.badge} 
                    discount={product.discount}
                    stock={product.stock}
                    avgRating={ratings[product.id]?.avgRating}
                    reviewCount={ratings[product.id]?.reviewCount}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4" role="list" aria-label="Active filters">
            {productType !== 'All' && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs" role="listitem">
                {productType}
                <button onClick={() => { setProductType('All'); setVisibleCount(PRODUCTS_PER_PAGE); }} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label={`Remove ${productType} filter`}>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs" role="listitem">
                {priceRangeOptions.find(o => o.value === priceRange)?.label}
                <button onClick={() => setPriceRange('all')} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Remove price filter">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs" role="listitem">
                "{searchQuery}"
                <button onClick={handleClearSearch} className="ml-1 hover:bg-muted rounded-full p-0.5" aria-label="Remove search filter">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Products Grid */}
        <section className="flex-1 min-h-[400px]" aria-label="Products list">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3" aria-busy="true" aria-label="Loading products">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-background rounded-xl sm:rounded-2xl border border-border overflow-hidden" aria-hidden="true">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <div className="p-3 sm:p-4 space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-5 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-9 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24" role="status">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term or check the spelling.`
                  : 'Try adjusting your filters to find what you\'re looking for.'}
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
              {/* Show popular products when search fails */}
              {searchQuery && products.length > 0 && (
                <div className="mt-10 w-full">
                  <h4 className="text-sm font-semibold text-foreground mb-4 text-center">Popular Products</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
                    {products.filter(p => p.discount && p.discount > 0).slice(0, 4).map(product => (
                      <ProductCard 
                        key={product.id} 
                        id={product.id} 
                        name={product.name} 
                        price={product.price}
                        category={product.category} 
                        image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'}
                        badge={product.badge} 
                        discount={product.discount}
                        stock={product.stock}
                        avgRating={ratings[product.id]?.avgRating}
                        reviewCount={ratings[product.id]?.reviewCount}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={`grid gap-2 sm:gap-3 ${
                gridCols === 3 
                  ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-3' 
                  : gridCols === 4 
                    ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                    : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              }`}>
                {paginatedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    id={product.id} 
                    name={product.name} 
                    price={product.price}
                    category={product.category} 
                    image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'}
                    badge={product.badge} 
                    discount={product.discount}
                    stock={product.stock}
                    avgRating={ratings[product.id]?.avgRating}
                    reviewCount={ratings[product.id]?.reviewCount}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-6 sm:mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                    className="rounded-xl px-8 min-h-[44px]"
                  >
                    Load More ({sortedProducts.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
              {!hasMore && sortedProducts.length > PRODUCTS_PER_PAGE && (
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Showing all {sortedProducts.length} products
                </p>
              )}
            </>
          )}
        </section>
        {/* Recently Viewed Section */}
        {recentProducts.length > 0 && (
          <section className="mt-8 sm:mt-12" aria-label="Recently viewed products">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Recently Viewed</h2>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-none -mx-1 px-1">
              {recentProducts.map(product => (
                <div key={product.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                  <ProductCard 
                    id={product.id} 
                    name={product.name} 
                    price={product.price}
                    category={product.category} 
                    image={product.image}
                    badge={product.badge} 
                    discount={product.discount}
                    stock={product.stock}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default ShopPage;
