import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

const CartPage = () => {
  const { items, updateQuantity, removeItem, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to get started!</p>
          <Button onClick={() => navigate('/')} variant="hero">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-xl p-4 border border-border flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.category === 'Pet' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-secondary/10 text-secondary'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 bg-muted rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-muted-foreground/10 rounded-l-lg transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-muted-foreground/10 rounded-r-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-destructive hover:underline"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>৳{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>৳60</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>৳{(totalAmount + 60).toLocaleString()}</span>
                </div>
              </div>

              <Button 
                variant="accent" 
                className="w-full"
                size="lg"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
