import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { checkoutSchema } from '@/lib/validations';

const CheckoutPage = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    division: '',
    district: '',
    thana: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ 
        title: 'Login Required', 
        description: 'Please login to place an order.',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    // Validate form data
    const validationResult = checkoutSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({ title: 'Validation Error', description: 'Please check the form for errors.', variant: 'destructive' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const validatedData = validationResult.data;
      const shippingAddress = `${validatedData.fullName}, ${validatedData.phone}, ${validatedData.address}, ${validatedData.thana}, ${validatedData.district}, ${validatedData.division}`;
      
      const { error } = await supabase.from('orders').insert([{
        user_id: user.id,
        items: items as any,
        total_amount: totalAmount + 60,
        shipping_address: shippingAddress,
      }]);

      if (error) throw error;

      clearCart();
      setOrderPlaced(true);
      toast({ title: 'Order Placed!', description: 'Your order has been placed successfully.' });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: 'Failed to place order. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <CheckCircle className="h-24 w-24 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Thank you for your order. We'll deliver it to your Thana soon!
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} variant="hero">
              Continue Shopping
            </Button>
            <Button onClick={() => navigate('/profile')} variant="outline">
              View Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 border border-border space-y-6">
              <h2 className="text-xl font-semibold text-foreground">Shipping Information</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value.slice(0, 100) })}
                    maxLength={100}
                    required
                  />
                  {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.slice(0, 20) })}
                    placeholder="+880 1XXX-XXXXXX"
                    maxLength={20}
                    required
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 500) })}
                  placeholder="House #, Road #, Area"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground">{formData.address.length}/500 characters</p>
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Input
                    id="division"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value.slice(0, 50) })}
                    placeholder="e.g. Dhaka"
                    maxLength={50}
                    required
                  />
                  {errors.division && <p className="text-sm text-red-500">{errors.division}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value.slice(0, 50) })}
                    placeholder="e.g. Dhaka"
                    maxLength={50}
                    required
                  />
                  {errors.district && <p className="text-sm text-red-500">{errors.district}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thana">Thana</Label>
                  <Input
                    id="thana"
                    value={formData.thana}
                    onChange={(e) => setFormData({ ...formData, thana: e.target.value.slice(0, 50) })}
                    placeholder="e.g. Dhanmondi"
                    maxLength={50}
                    required
                  />
                  {errors.thana && <p className="text-sm text-red-500">{errors.thana}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 1000) })}
                  placeholder="Any special instructions..."
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">{formData.notes.length}/1000 characters</p>
                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
              </div>

              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Placing Order...' : `Place Order - ৳${(totalAmount + 60).toLocaleString()}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium">৳{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
