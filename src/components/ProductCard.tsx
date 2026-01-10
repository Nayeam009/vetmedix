import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

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
  
  const finalPrice = discount ? Math.round(price * (1 - discount / 100)) : price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ id: id || name, name, price: finalPrice, image, category });
  };

  return (
    <div 
      className="group bg-card rounded-2xl overflow-hidden shadow-card card-hover border border-border cursor-pointer"
      onClick={() => id && navigate(`/product/${id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {badge && (
            <span className="badge-rx">{badge}</span>
          )}
          {discount && (
            <span className="badge-sale">{discount}% OFF</span>
          )}
        </div>
        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card">
          <Heart className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
        {/* Category Tag */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            category === 'Pet' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-secondary/10 text-secondary'
          }`}>
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">৳{price.toLocaleString()}</span>
            {discount && (
              <span className="text-sm text-muted-foreground line-through">
                ৳{Math.round(price * (1 + discount / 100)).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <Button variant="accent" className="w-full group/btn" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
