import { memo } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProductCardProps {
  id?: string;
  name: string;
  price: number;
  category: string;
  image: string;
  badge?: string | null;
  discount?: number | null;
  stock?: number | null;
  avgRating?: number;
  reviewCount?: number;
}

const ProductCard = memo(({ id, name, price, category, image, badge, discount, stock, avgRating, reviewCount }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  
  const finalPrice = discount ? Math.round(price * (1 - discount / 100)) : price;
  const originalPrice = discount ? price : null;
  const wishlisted = id ? isWishlisted(id) : false;
  const isOutOfStock = stock !== null && stock !== undefined && stock <= 0;
  const isLowStock = stock !== null && stock !== undefined && stock > 0 && stock <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({ id: id || name, name, price: finalPrice, image, category });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.info('Please log in to save items');
      return;
    }
    if (id) toggleWishlist(id);
  };

  return (
    <div 
      className="group bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-card hover:shadow-hover border border-border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
      onClick={() => id && navigate(`/product/${id}`)}
    >
      {/* Image Container with AspectRatio for CLS prevention */}
      <AspectRatio ratio={1} className="overflow-hidden bg-secondary/30">
        <img
          src={image}
          alt={name}
          loading="lazy"
          width={300}
          height={300}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
        />
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
            <span className="bg-destructive text-destructive-foreground text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              Stock Out
            </span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2 z-10">
          {badge && (
            <span className="badge-rx text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">{badge}</span>
          )}
          {discount && !isOutOfStock && (
            <span className="badge-sale text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">{discount}% OFF</span>
          )}
          {isLowStock && (
            <span className="bg-amber-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
              Only {stock} left!
            </span>
          )}
        </div>
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 h-9 w-9 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all active:scale-90 z-10 ${
            wishlisted 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-card/80 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 hover:bg-card'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>
      </AspectRatio>

      {/* Content */}
      <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[32px] sm:min-h-[48px]">
          {name}
        </h3>
        
        {/* Rating Display */}
        {avgRating !== undefined && avgRating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[10px] sm:text-xs font-medium text-foreground">{avgRating.toFixed(1)}</span>
            {reviewCount !== undefined && reviewCount > 0 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-base sm:text-xl font-bold text-foreground">৳{finalPrice.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
              ৳{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <Button 
            variant={isOutOfStock ? "secondary" : "default"}
            size="sm"
            className="flex-1 h-8 sm:h-10 text-xs sm:text-sm rounded-lg sm:rounded-xl active:scale-95" 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Add to Cart
              </>
            )}
          </Button>
          {!isOutOfStock && (
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-lg sm:rounded-xl active:scale-95 shrink-0 ${
                wishlisted ? 'border-destructive text-destructive hover:bg-destructive/10' : ''
              }`}
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wishlisted ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
