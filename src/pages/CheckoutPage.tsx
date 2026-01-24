import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CheckCircle, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  MapPin, 
  Truck, 
  ChevronRight,
  Shield,
  Package,
  Lock,
  User,
  Phone,
  Home,
  FileText
} from 'lucide-react';
import { checkoutSchema } from '@/lib/validations';
import { notifyAdminsOfNewOrder } from '@/lib/notifications';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

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

const getDeliveryCharge = (division: string): number => {
  if (!division) return 60;
  const normalizedDivision = division.toLowerCase().trim();
  return normalizedDivision === 'dhaka' ? 60 : 120;
};

const CheckoutPage = () => {
  useDocumentTitle('Checkout');
  const { items, totalAmount, clearCart, totalItems } = useCart();
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
      
      const { data: orderData, error } = await supabase.from('orders').insert([{
        user_id: user.id,
        items: items as any,
        total_amount: grandTotal,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
      }]).select('id').single();

      if (error) throw error;

      // Notify admins of new order
      if (orderData) {
        await notifyAdminsOfNewOrder({
          orderId: orderData.id,
          orderTotal: grandTotal,
          itemCount: totalItems,
        });
      }

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
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-2 text-sm sm:text-base">
              Thank you for your order. We'll deliver it to your address soon!
            </p>
            {paymentMethod === 'cod' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 my-6">
                <Banknote className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Please keep <span className="font-bold">৳{grandTotal.toLocaleString()}</span> ready for Cash on Delivery
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/')} size="lg" className="rounded-xl">
                Continue Shopping
              </Button>
              <Button onClick={() => navigate('/profile')} variant="outline" size="lg" className="rounded-xl">
                View Orders
              </Button>
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
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
            <button onClick={() => navigate('/cart')} className="hover:text-primary transition-colors">
              Cart
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      {/* Checkout Progress */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground hidden sm:inline">Cart</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold">
                2
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground hidden sm:inline">Checkout</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-semibold">
                3
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:inline">Done</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Shipping Information */}
              <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Shipping Information</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">Where should we deliver your order?</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value.slice(0, 100) })}
                        placeholder="Your full name"
                        className="h-11 rounded-lg"
                        maxLength={100}
                        required
                      />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.slice(0, 20) })}
                        placeholder="+880 1XXX-XXXXXX"
                        className="h-11 rounded-lg"
                        maxLength={20}
                        required
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      Street Address
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 500) })}
                      placeholder="House #, Road #, Area"
                      className="min-h-[80px] rounded-lg resize-none"
                      maxLength={500}
                      required
                    />
                    {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="division" className="text-sm">Division</Label>
                      <Input
                        id="division"
                        value={formData.division}
                        onChange={(e) => setFormData({ ...formData, division: e.target.value.slice(0, 50) })}
                        placeholder="Dhaka"
                        className="h-11 rounded-lg"
                        maxLength={50}
                        required
                      />
                      {errors.division && <p className="text-xs text-destructive">{errors.division}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-sm">District</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value.slice(0, 50) })}
                        placeholder="Dhaka"
                        className="h-11 rounded-lg"
                        maxLength={50}
                        required
                      />
                      {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thana" className="text-sm">Thana</Label>
                      <Input
                        id="thana"
                        value={formData.thana}
                        onChange={(e) => setFormData({ ...formData, thana: e.target.value.slice(0, 50) })}
                        placeholder="Dhanmondi"
                        className="h-11 rounded-lg"
                        maxLength={50}
                        required
                      />
                      {errors.thana && <p className="text-xs text-destructive">{errors.thana}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      Order Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 1000) })}
                      placeholder="Any special instructions for delivery..."
                      className="min-h-[60px] rounded-lg resize-none"
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Payment Method</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">Select how you want to pay</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div
                          key={method.id}
                          className={`relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all ${
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
                          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === method.id && method.available
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm sm:text-base">{method.name}</span>
                              {!method.available && (
                                <span className="text-[10px] sm:text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          {paymentMethod === method.id && method.available && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {paymentMethod === 'cod' && (
                    <div className="mt-4 p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                        💵 <strong>Cash on Delivery:</strong> Please keep the exact amount ready. 
                        Our delivery partner will collect <strong>৳{grandTotal.toLocaleString()}</strong> at your doorstep.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Place Order Button */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl hidden md:flex" 
                disabled={loading}
              >
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {loading ? 'Placing Order...' : `Place Order - ৳${grandTotal.toLocaleString()}`}
              </Button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm sticky top-24">
              <div className="p-4 sm:p-5 border-b border-border">
                <h2 className="font-bold text-foreground">Order Summary</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
              </div>
              
              {/* Order Items */}
              <div className="max-h-[280px] overflow-y-auto">
                <div className="p-4 sm:p-5 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground flex-shrink-0">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-4 sm:p-5 border-t border-border space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>৳{totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Delivery</span>
                  </div>
                  <span>৳{deliveryCharge}</span>
                </div>
                
                {/* Delivery Zone Info */}
                <div className="flex items-center gap-2 text-xs p-2 sm:p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {formData.division ? (
                      formData.division.toLowerCase() === 'dhaka' ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Inside Dhaka - ৳60</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Outside Dhaka - ৳120</span>
                      )
                    ) : (
                      'Enter division for delivery rate'
                    )}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>৳{grandTotal.toLocaleString()}</span>
                </div>

                {paymentMethod === 'cod' && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10">
                    <Banknote className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Cash on Delivery</span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="p-4 sm:p-5 border-t border-border">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>Protected</span>
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
          <div>
            <span className="text-xs text-muted-foreground">Total</span>
            <p className="text-lg font-bold text-foreground">৳{grandTotal.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure Checkout</span>
          </div>
        </div>
        <Button 
          onClick={handleSubmit}
          className="w-full h-12 text-base font-semibold rounded-xl"
          disabled={loading}
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default CheckoutPage;
