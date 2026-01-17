import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft, 
  ShoppingCart,
  Truck,
  Shield,
  Tag,
  ChevronRight,
  Package
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Separator } from '@/components/ui/separator';
import MobileNav from '@/components/MobileNav';

const CartPage = () => {
  const { items, updateQuantity, removeItem, totalAmount, clearCart, totalItems } = useCart();
  const navigate = useNavigate();

  const deliveryCharge = totalAmount >= 500 ? 0 : 60;
  const grandTotal = totalAmount + deliveryCharge;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 pb-20 md:pb-0">
        <Navbar />
        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
            <Button onClick={() => navigate('/shop')} size="lg" className="rounded-xl">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-32 md:pb-8">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
              Home
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Shopping Cart</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Shopping Cart</h1>
            <p className="text-muted-foreground text-sm mt-1">{totalItems} item{totalItems > 1 ? 's' : ''} in your cart</p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-destructive hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" />
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="bg-background rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-border shadow-sm flex gap-3 sm:gap-4"
              >
                {/* Product Image */}
                <div 
                  className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-muted cursor-pointer"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <h3 
                        className="font-medium text-sm sm:text-base text-foreground line-clamp-2 hover:text-primary cursor-pointer transition-colors"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        {item.name}
                      </h3>
                      <span className={`inline-block mt-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.category === 'Pet' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-accent/10 text-accent'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 h-fit"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center hover:bg-muted transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <span className="font-medium w-8 sm:w-10 text-center text-sm sm:text-base">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                      {item.quantity > 1 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          ৳{item.price.toLocaleString()} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <button 
              onClick={() => navigate('/shop')}
              className="flex items-center gap-2 text-sm text-primary hover:underline mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm sticky top-24">
              <div className="p-4 sm:p-5 lg:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Order Summary</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>৳{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      <span>Delivery</span>
                    </div>
                    {deliveryCharge === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      <span>৳{deliveryCharge}</span>
                    )}
                  </div>
                  
                  {totalAmount < 500 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary">
                        <Tag className="h-3 w-3 inline mr-1" />
                        Add ৳{(500 - totalAmount).toLocaleString()} more for FREE delivery!
                      </p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-base sm:text-lg font-bold text-foreground pt-1">
                    <span>Total</span>
                    <span>৳{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl mt-5"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="border-t border-border p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Express Delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Track Your Order</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4 text-primary" />
                    <span>Best Prices</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:hidden z-40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total ({totalItems} items)</span>
          <span className="text-lg font-bold text-foreground">৳{grandTotal.toLocaleString()}</span>
        </div>
        <Button 
          className="w-full h-12 text-base font-semibold rounded-xl"
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </Button>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default CartPage;
