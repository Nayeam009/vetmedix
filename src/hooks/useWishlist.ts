import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);
      if (data) {
        setWishlistIds(new Set(data.map(w => w.product_id)));
      }
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!user) return false;
    
    const isCurrently = wishlistIds.has(productId);
    
    // Optimistic update
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (isCurrently) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (isCurrently) {
        await supabase.from('wishlists').delete()
          .eq('user_id', user.id).eq('product_id', productId);
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      }
      return true;
    } catch {
      // Revert on error
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (isCurrently) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return false;
    }
  }, [user, wishlistIds]);

  const isWishlisted = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return { wishlistIds, isWishlisted, toggleWishlist, loading, refetch: fetchWishlist };
};
