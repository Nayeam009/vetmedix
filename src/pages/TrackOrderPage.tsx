import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Loader2,
  MapPin,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TrackingStatus {
  status: number;
  delivery_status: string;
}

interface OrderDetails {
  id: string;
  status: string;
  tracking_id: string | null;
  consignment_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  total_amount: number;
  shipping_address: string | null;
  items: any[];
}

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const orderId = searchParams.get('id');
  const [trackingCode, setTrackingCode] = useState('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setOrder(data as unknown as OrderDetails);
      
      if (data.tracking_id) {
        setTrackingCode(data.tracking_id);
        await fetchTrackingStatus(data.tracking_id);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch order details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrackingStatus = async (code: string) => {
    if (!code) return;
    
    setIsTracking(true);
    try {
      const { data, error } = await supabase.functions.invoke('steadfast', {
        body: {
          action: 'track_by_tracking_code',
          tracking_code: code,
        },
      });

      if (error) throw error;
      setTrackingStatus(data);
    } catch (error) {
      console.error('Error tracking order:', error);
      // Don't show error toast for tracking - it might just be pending
    } finally {
      setIsTracking(false);
    }
  };

  const handleTrackByCode = async () => {
    if (!trackingCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a tracking code',
        variant: 'destructive',
      });
      return;
    }
    await fetchTrackingStatus(trackingCode.trim());
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'shipped':
      case 'in_transit':
        return <Truck className="h-6 w-6 text-blue-600" />;
      case 'processing':
        return <Package className="h-6 w-6 text-purple-600" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case 'in_review':
        return 'In Review';
      case 'pending':
        return 'Pending Pickup';
      case 'delivered_approval_pending':
        return 'Delivered (Pending Approval)';
      case 'partial_delivered_approval_pending':
        return 'Partially Delivered';
      case 'cancelled_approval_pending':
        return 'Cancelled (Pending)';
      case 'delivered':
        return 'Delivered';
      default:
        return status?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Track Your Order
              </CardTitle>
              <CardDescription>
                Enter your tracking code or view order details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tracking code"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackByCode()}
                />
                <Button onClick={handleTrackByCode} disabled={isTracking}>
                  {isTracking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : order ? (
            <>
              {/* Order Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Placed on {format(new Date(order.created_at), 'PPP')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-medium">
                        {order.status === 'pending' && 'Waiting for admin approval'}
                        {order.status === 'processing' && 'Order is being processed'}
                        {order.status === 'shipped' && 'Order is on the way'}
                        {order.status === 'delivered' && 'Order has been delivered'}
                        {order.status === 'cancelled' && 'Order was cancelled'}
                      </p>
                      {order.rejection_reason && (
                        <p className="text-sm text-destructive mt-1">
                          Reason: {order.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.tracking_id && (
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Tracking Code</p>
                      <p className="font-mono font-bold text-lg">{order.tracking_id}</p>
                      {order.consignment_id && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Consignment ID: {order.consignment_id}
                        </p>
                      )}
                    </div>
                  )}

                  {order.shipping_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Shipping Address</p>
                        <p className="text-sm">{order.shipping_address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Tracking Card */}
              {trackingStatus && trackingStatus.status === 200 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Status (Steadfast)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {getStatusIcon(trackingStatus.delivery_status)}
                      <div>
                        <Badge className={getStatusColor(trackingStatus.delivery_status)}>
                          {getDeliveryStatusLabel(trackingStatus.delivery_status)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="h-12 w-12 rounded-lg object-cover" 
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold">৳{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-primary">৳{order.total_amount}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter a tracking code above to track your order
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrderPage;
