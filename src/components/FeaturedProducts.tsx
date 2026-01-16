import { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  discount: number | null;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(8);
      
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

  const filteredProducts = activeFilter === 'All' 
    ? products 
    : products.filter(p => p.category === activeFilter);

  const filters = ['All', 'Pet', 'Farm'];

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Best sellers for your pets and farm animals
            </p>
          </div>
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground border border-border hover:border-primary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                category={product.category as 'Pet' | 'Farm'}
                image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=400&fit=crop'}
                badge={product.badge || undefined}
                discount={product.discount || undefined}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/shop">
            <Button variant="outline" size="lg" className="group">
              View All Products
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;