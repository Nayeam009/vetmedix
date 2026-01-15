import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { ArrowLeft, CheckCircle, Banknote, CreditCard, Smartphone, MapPin, Truck } from 'lucide-react';
import { checkoutSchema } from '@/lib/validations';

const paymentMethods = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: Banknote,
    available: true,
  },
  {
    id: 'bkash',
    name: 'bKash',
    description: 'Pay with bKash mobile banking',
    icon: Smartphone,
    available: false,
  },
  {
    id: 'nagad',
    name: 'Nagad',
    description: 'Pay with Nagad mobile banking',
    icon: Smartphone,
    available: false,
  },
  {
    id: 'online',
    name: 'Card Payment',
    description: 'Pay with credit/debit card',
    icon: CreditCard,
    available: false,
  },
];

// Delivery charge calculation based on division
const getDeliveryCharge = (division: string): number => {
  if (!division) return 60; // Default to Dhaka rate
  const normalizedDivision = division.toLowerCase().trim();
  return normalizedDivision === 'dhaka' ? 60 : 120;
};

const CheckoutPage = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    division: '',
    district: '',
    thana: '',
    notes: '',
  });

  // Calculate delivery charge dynamically
  const deliveryCharge = getDeliveryCharge(formData.division);
  const grandTotal = totalAmount + deliveryCharge;

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
        total_amount: grandTotal,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
      }]);

      if (error) throw error;

      clearCart();
      setOrderPlaced(true);
      toast({ title: 'Order Placed!', description: 'Your order has been placed successfully.' });
    } catch (error: unknown) {
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
          <p className="text-muted-foreground mb-2 max-w-md mx-auto">
            Thank you for your order. We'll deliver it to your Thana soon!
          </p>
          {paymentMethod === 'cod' && (
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              💵 Please keep <span className="font-semibold text-primary">৳{grandTotal.toLocaleString()}</span> ready for Cash on Delivery.
            </p>
          )}
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
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-6">
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
                </CardContent>
              </Card>

              {/* Payment Method Section */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Payment Method</h2>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div
                          key={method.id}
                          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                            method.available 
                              ? paymentMethod === method.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50 cursor-pointer'
                              : 'border-border/50 bg-muted/30 opacity-60 cursor-not-allowed'
                          }`}
                          onClick={() => method.available && setPaymentMethod(method.id)}
                        >
                          <RadioGroupItem 
                            value={method.id} 
                            id={method.id} 
                            disabled={!method.available}
                            className="sr-only"
                          />
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                            paymentMethod === method.id && method.available
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{method.name}</span>
                              {!method.available && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          {paymentMethod === method.id && method.available && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {paymentMethod === 'cod' && (
                    <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        💵 <strong>Cash on Delivery:</strong> Please keep the exact amount ready when the delivery person arrives. 
                        Our delivery partner will collect <strong>৳{grandTotal.toLocaleString()}</strong> at your doorstep.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Placing Order...' : `Place Order - ৳${grandTotal.toLocaleString()}`}
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
                
                {/* Dynamic Delivery Charge */}
                <div className="flex justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Delivery</span>
                  </div>
                  <span>৳{deliveryCharge}</span>
                </div>
                
                {/* Delivery Location Info */}
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-secondary/50">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">
                    {formData.division ? (
                      formData.division.toLowerCase() === 'dhaka' ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Inside Dhaka - ৳60</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Outside Dhaka - ৳120</span>
                      )
                    ) : (
                      <span>Enter division for delivery rate</span>
                    )}
                  </span>
                </div>
                
                <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {paymentMethod === 'cod' && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 text-center">
                  <Banknote className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-sm font-medium text-primary">Cash on Delivery</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;