import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Loader2, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [priceRange, setPriceRange] = useState('All');

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
      // Error logged only in development
      if (import.meta.env.DEV) {
        console.error('Error fetching products:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Mobile Search - Top */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-full bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Filters - Horizontal on mobile, Sidebar on desktop */}
          <aside className="w-full md:w-56 lg:w-64">
            <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border">
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Category</label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                    {['All', 'Pet', 'Farm'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all active:scale-95 ${
                          category === cat 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Desktop Search */}
            <div className="hidden md:flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 sm:h-64">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map(product => (
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
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default ShopPage;