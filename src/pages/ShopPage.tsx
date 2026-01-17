import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, SlidersHorizontal, Grid3X3, LayoutGrid, Package, ChevronDown, X, Sparkles } from 'lucide-react';
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

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState('newest');
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [priceRange, setPriceRange] = useState<'all' | 'under500' | '500to1000' | 'over1000'>('all');

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*');
      if (category !== 'All') query = query.eq('category', category);
      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching products:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  let filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const activeFiltersCount = [
    category !== 'All',
    priceRange !== 'all',
    searchQuery.length > 0
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategory('All');
    setPriceRange('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-border">
        <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                Shop All Products
              </h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                Discover the best products for your pets and farm animals
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4 text-primary" />
              <span>{sortedProducts.length} products</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Search, Filter & Sort Bar */}
        <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Row */}
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 sm:h-11 pl-9 sm:pl-11 pr-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:hidden h-10 w-10 relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
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
                    {/* Category Filter */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Category</h3>
                      <div className="flex flex-wrap gap-2">
                        {['All', 'Pet', 'Farm'].map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                              category === cat 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Price Range Filter */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Price Range</h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: 'All Prices' },
                          { value: 'under500', label: 'Under ৳500' },
                          { value: '500to1000', label: '৳500 - ৳1000' },
                          { value: 'over1000', label: 'Over ৳1000' },
                        ].map(option => (
                          <button 
                            key={option.value} 
                            onClick={() => setPriceRange(option.value as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                              priceRange === option.value 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Sort Options */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Sort By</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'newest', label: 'Newest' },
                          { value: 'price-low', label: 'Price: Low to High' },
                          { value: 'price-high', label: 'Price: High to Low' },
                          { value: 'discount', label: 'Best Discount' },
                        ].map(option => (
                          <button 
                            key={option.value} 
                            onClick={() => setSortBy(option.value)}
                            className={`px-4 py-3 text-sm font-medium rounded-xl transition-all text-left ${
                              sortBy === option.value 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
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
              {/* Category Filters */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border">
                  {['All', 'Pet', 'Farm'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        category === cat 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                {/* Price Range Select */}
                <Select value={priceRange} onValueChange={(v: any) => setPriceRange(v)}>
                  <SelectTrigger className="w-[150px] h-10 rounded-lg">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under500">Under ৳500</SelectItem>
                    <SelectItem value="500to1000">৳500 - ৳1000</SelectItem>
                    <SelectItem value="over1000">Over ৳1000</SelectItem>
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    Clear filters
                    <X className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-3">
                {/* Sort Select */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-10 rounded-lg">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="discount">Best Discount</SelectItem>
                  </SelectContent>
                </Select>

                {/* Grid View Toggle */}
                <div className="hidden lg:flex items-center bg-muted/50 rounded-lg p-1 border border-border">
                  <button
                    onClick={() => setGridCols(2)}
                    className={`p-2 rounded transition-all ${gridCols === 2 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(3)}
                    className={`p-2 rounded transition-all ${gridCols === 3 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`p-2 rounded transition-all ${gridCols === 4 ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="3" height="3" rx="0.5" />
                      <rect x="5" y="1" width="3" height="3" rx="0.5" />
                      <rect x="9" y="1" width="3" height="3" rx="0.5" />
                      <rect x="13" y="1" width="2" height="3" rx="0.5" />
                      <rect x="1" y="5" width="3" height="3" rx="0.5" />
                      <rect x="5" y="5" width="3" height="3" rx="0.5" />
                      <rect x="9" y="5" width="3" height="3" rx="0.5" />
                      <rect x="13" y="5" width="2" height="3" rx="0.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {category !== 'All' && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {category}
                <button onClick={() => setCategory('All')} className="ml-1 hover:bg-muted rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {priceRange === 'under500' ? 'Under ৳500' : priceRange === '500to1000' ? '৳500-৳1000' : 'Over ৳1000'}
                <button onClick={() => setPriceRange('all')} className="ml-1 hover:bg-muted rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 pr-1">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:bg-muted rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-background rounded-xl sm:rounded-2xl border border-border overflow-hidden">
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
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Try adjusting your filters or search to find what you're looking for.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 ${
              gridCols === 2 
                ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3' 
                : gridCols === 3 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {sortedProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  id={product.id} 
                  name={product.name} 
                  price={product.price}
                  category={product.category} 
                  image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'}
                  badge={product.badge} 
                  discount={product.discount}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default ShopPage;
