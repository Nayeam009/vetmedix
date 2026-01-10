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
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 space-y-6">
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['All', 'Pet', 'Farm'].map(cat => (
                      <button key={cat} onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search products..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-card border border-border focus:border-primary outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} id={product.id} name={product.name} price={product.price}
                    category={product.category} image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400'}
                    badge={product.badge} discount={product.discount}
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