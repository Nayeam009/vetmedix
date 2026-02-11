import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  discount: number | null;
  stock: number | null;
}

const WishlistPage = () => {
  useDocumentTitle('My Wishlist');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { wishlistIds, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading, navigate]);

  // Re-fetch products whenever wishlistIds changes
  useEffect(() => {
    if (!user || wishlistLoading) return;
    
    const ids = Array.from(wishlistIds);
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, price, category, image_url, badge, discount, stock')
          .in('id', ids);

        if (data) {
          setProducts(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, wishlistIds, wishlistLoading]);

  if (authLoading || (wishlistLoading && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Wishlist</h1>
            <p className="text-sm text-muted-foreground">{products.length} saved items</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">Save items you love to find them later</p>
            <Button onClick={() => navigate('/shop')} className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                category={product.category}
                image={product.image_url || ''}
                badge={product.badge}
                discount={product.discount}
                stock={product.stock}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default WishlistPage;
