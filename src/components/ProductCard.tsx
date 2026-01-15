import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

interface ProductCardProps {
  id?: string;
  name: string;
  price: number;
  category: 'Pet' | 'Farm';
  image: string;
  badge?: string;
  discount?: number;
}

const ProductCard = ({ id, name, price, category, image, badge, discount }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const finalPrice = discount ? Math.round(price * (1 - discount / 100)) : price;
  const originalPrice = discount ? price : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ id: id || name, name, price: finalPrice, image, category });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div 
      className="group bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-card hover:shadow-hover border border-border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
      onClick={() => id && navigate(`/product/${id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2">
          {badge && (
            <span className="badge-rx text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">{badge}</span>
          )}
          {discount && (
            <span className="badge-sale text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">{discount}% OFF</span>
          )}
        </div>
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isWishlisted 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-card/80 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 hover:bg-card'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
        {/* Category Tag */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
          <span className={`text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
            category === 'Pet' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-accent/10 text-accent'
          }`}>
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[32px] sm:min-h-[48px]">
          {name}
        </h3>
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-base sm:text-xl font-bold text-foreground">৳{finalPrice.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
              ৳{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <Button 
          variant="default" 
          size="sm"
          className="w-full h-8 sm:h-10 text-xs sm:text-sm rounded-lg sm:rounded-xl active:scale-95" 
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;