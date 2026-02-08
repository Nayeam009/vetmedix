import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal,
  AlertCircle,
  ShoppingCart,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
  CreditCard,
  Ban,
  Download,
  ShieldAlert,
  Phone,
  User,
  Copy,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdmin, useAdminOrders } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { createOrderNotification } from '@/lib/notifications';
import { AcceptOrderDialog } from '@/components/admin/AcceptOrderDialog';
import { RejectOrderDialog } from '@/components/admin/RejectOrderDialog';
import { FraudRiskBadge } from '@/components/admin/FraudRiskBadge';
import { FraudAnalysisPanel } from '@/components/admin/FraudAnalysisPanel';
import { OrderStatsBar } from '@/components/admin/OrderStatsBar';
import { OrderCardsSkeleton, OrderTableSkeleton, OrderStatsBarSkeleton } from '@/components/admin/OrdersSkeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { downloadCSV } from '@/lib/csvParser';
import { analyzeFraudRisk, parseShippingAddress, type FraudAnalysis } from '@/lib/fraudDetection';

const AdminOrders = () => {
  useDocumentTitle('Orders Management - Admin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const { data: orders, isLoading } = useAdminOrders();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [orderForAction, setOrderForAction] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  // Real-time order updates for admin
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  // Compute fraud analysis for all orders (memoized)
  const fraudAnalysisMap = useMemo(() => {
    if (!orders) return new Map<string, FraudAnalysis>();

    const map = new Map<string, FraudAnalysis>();
    const ordersByUser = new Map<string, typeof orders>();
    for (const order of orders) {
      const userId = order.user_id;
      if (!ordersByUser.has(userId)) {
        ordersByUser.set(userId, []);
      }
      ordersByUser.get(userId)!.push(order);
    }

    for (const order of orders) {
      const profile = (order as any).profile || null;
      const userOrders = ordersByUser.get(order.user_id) || [];
      const analysis = analyzeFraudRisk(order, profile, userOrders);
      map.set(order.id, analysis);
    }

    return map;
  }, [orders]);

  // Order stats for the stats bar
  const orderStats = useMemo(() => {
    if (!orders) return { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, flagged: 0, total: 0, revenue: 0 };

    const excludedStatuses = ['cancelled', 'rejected'];
    let pending = 0, processing = 0, shipped = 0, delivered = 0, cancelled = 0, flagged = 0, revenue = 0;

    for (const order of orders) {
      switch (order.status) {
        case 'pending': pending++; break;
        case 'processing': processing++; break;
        case 'shipped': shipped++; break;
        case 'delivered': delivered++; break;
        case 'cancelled':
        case 'rejected': cancelled++; break;
      }

      if (!excludedStatuses.includes(order.status || '')) {
        revenue += order.total_amount || 0;
      }

      const analysis = fraudAnalysisMap.get(order.id);
      if (analysis && (analysis.level === 'medium' || analysis.level === 'high')) {
        flagged++;
      }
    }

    return { pending, processing, shipped, delivered, cancelled, flagged, total: orders.length, revenue };
  }, [orders, fraudAnalysisMap]);

  // Count high-risk pending orders for alert banner
  const highRiskPendingCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(o => {
      const analysis = fraudAnalysisMap.get(o.id);
      return o.status === 'pending' && analysis?.level === 'high';
    }).length;
  }, [orders, fraudAnalysisMap]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      if (order && ['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        await createOrderNotification({
          userId: order.user_id,
          orderId: orderId,
          status: status as 'processing' | 'shipped' | 'delivered' | 'cancelled',
          orderTotal: order.total_amount,
        });
      }

      toast({ title: 'Success', description: `Order status updated to ${status}` });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cod':
        return <Badge variant="outline" className="gap-1"><CreditCard className="h-3 w-3" />COD</Badge>;
      case 'bkash':
        return <Badge variant="outline" className="text-pink-600 border-pink-300">bKash</Badge>;
      case 'nagad':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Nagad</Badge>;
      default:
        return <Badge variant="outline">Cash</Badge>;
    }
  };

  /** Extract customer name from shipping address or profile */
  const getCustomerName = (order: any): string => {
    // Try profile name first
    if (order.profile?.full_name) return order.profile.full_name;
    // Fall back to parsing shipping address
    if (order.shipping_address) {
      const parsed = parseShippingAddress(order.shipping_address);
      return parsed.name || 'Unknown';
    }
    return 'Unknown';
  };

  /** Extract customer phone from shipping address or profile */
  const getCustomerPhone = (order: any): string => {
    if (order.profile?.phone) return order.profile.phone;
    if (order.shipping_address) {
      const parsed = parseShippingAddress(order.shipping_address);
      return parsed.phone || '';
    }
    return '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const filteredOrders = useMemo(() => {
    return orders?.filter(order => {
      const customerName = getCustomerName(order).toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        order.id.toLowerCase().includes(lowerQuery) ||
        order.shipping_address?.toLowerCase().includes(lowerQuery) ||
        customerName.includes(lowerQuery);
      
      if (statusFilter === 'flagged') {
        const analysis = fraudAnalysisMap.get(order.id);
        return matchesSearch && analysis && (analysis.level === 'medium' || analysis.level === 'high');
      }
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [orders, searchQuery, statusFilter, fraudAnalysisMap]);

  const handleExportCSV = () => {
    if (!filteredOrders.length) return;
    
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Items', 'Payment Method', 'Tracking ID', 'Total', 'Status', 'Risk Level', 'Risk Score'];
    const rows = filteredOrders.map(order => {
      const analysis = fraudAnalysisMap.get(order.id);
      return [
        order.id.slice(0, 8),
        format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
        `"${getCustomerName(order)}"`,
        getCustomerPhone(order),
        Array.isArray(order.items) ? order.items.length : 0,
        (order as any).payment_method || 'COD',
        (order as any).tracking_id || '',
        order.total_amount,
        order.status,
        analysis?.level || 'unknown',
        analysis?.score || 0,
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({ title: 'Success', description: 'Orders exported to CSV' });
  };

  if (authLoading || roleLoading) {
    return (
      <AdminLayout title="Orders" subtitle="Manage customer orders">
        <OrderStatsBarSkeleton />
        <OrderCardsSkeleton />
        <OrderTableSkeleton />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Orders" subtitle="Manage customer orders">
      {/* High-Risk Pending Alert Banner */}
      {highRiskPendingCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 sm:p-4">
          <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {highRiskPendingCount} high-risk pending order{highRiskPendingCount > 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Review flagged orders before processing
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
            onClick={() => setStatusFilter('flagged')}
          >
            View Flagged
          </Button>
        </div>
      )}

      {/* Order Stats Bar */}
      {isLoading ? (
        <OrderStatsBarSkeleton />
      ) : (
        <OrderStatsBar
          stats={orderStats}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      )}

      {/* Search + Export */}
      <div className="flex gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={!filteredOrders.length}
          className="h-10 sm:h-11 rounded-xl text-sm gap-2 shrink-0"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* Result count */}
      {(statusFilter !== 'all' || searchQuery) && (
        <p className="text-xs text-muted-foreground mb-2">
          Showing {filteredOrders.length} {statusFilter === 'flagged' ? 'flagged' : statusFilter !== 'all' ? statusFilter : ''} order{filteredOrders.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      {/* Orders - Mobile Cards / Desktop Table */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <>
            <OrderCardsSkeleton />
            <OrderTableSkeleton />
          </>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found</p>
            {statusFilter !== 'all' && (
              <Button variant="link" size="sm" onClick={() => setStatusFilter('all')} className="mt-2">
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border">
              {filteredOrders.map((order) => {
                const analysis = fraudAnalysisMap.get(order.id);
                const customerName = getCustomerName(order);
                return (
                  <div 
                    key={order.id} 
                    className="p-3 space-y-2 active:bg-muted/30 transition-colors"
                    onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}
                  >
                    {/* Row 1: Order ID + Risk + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-muted-foreground">#{order.id.slice(0, 8)}</span>
                        {analysis && analysis.level !== 'low' && (
                          <FraudRiskBadge analysis={analysis} compact />
                        )}
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>

                    {/* Row 2: Customer name + amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{customerName}</span>
                      </div>
                      <span className="font-bold text-primary text-lg shrink-0 ml-2">৳{order.total_amount}</span>
                    </div>

                    {/* Row 3: Date + Items + Payment */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                        <span>·</span>
                        <span>{Array.isArray(order.items) ? order.items.length : 0} items</span>
                      </div>
                      {getPaymentMethodBadge((order as any).payment_method || 'cod')}
                    </div>

                    {(order as any).tracking_id && (
                      <code className="text-xs bg-secondary px-2 py-1 rounded block truncate">
                        Tracking: {(order as any).tracking_id}
                      </code>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      {order.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            className="flex-1 h-11 rounded-xl text-sm bg-green-600 hover:bg-green-700 active:scale-95 transition-transform"
                            onClick={() => { setOrderForAction(order); setIsAcceptOpen(true); }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="flex-1 h-11 rounded-xl text-sm active:scale-95 transition-transform"
                            onClick={() => { setOrderForAction(order); setIsRejectOpen(true); }}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'rejected' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 h-11 rounded-xl text-sm">
                              <MoreHorizontal className="h-4 w-4 mr-1" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>
                              <Truck className="h-4 w-4 mr-2" />
                              Mark Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'delivered')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Mark Delivered
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const analysis = fraudAnalysisMap.get(order.id);
                    const customerName = getCustomerName(order);
                    return (
                      <TableRow key={order.id} className="cursor-pointer" onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}>
                        <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
                        <TableCell className="whitespace-nowrap">{format(new Date(order.created_at), 'MMM d, yy')}</TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{customerName}</span>
                        </TableCell>
                        <TableCell>
                          {Array.isArray(order.items) ? order.items.length : 0} items
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge((order as any).payment_method || 'cod')}
                        </TableCell>
                        <TableCell>
                          {(order as any).tracking_id ? (
                            <code className="text-xs bg-secondary px-2 py-1 rounded">
                              {(order as any).tracking_id}
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-primary">৳{order.total_amount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {analysis && <FraudRiskBadge analysis={analysis} />}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              
                              {order.status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={() => { setOrderForAction(order); setIsAcceptOpen(true); }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept Order
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => { setOrderForAction(order); setIsRejectOpen(true); }}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Reject Order
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'rejected' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Mark Shipped
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    Mark Delivered
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => { setOrderForAction(order); setIsRejectOpen(true); }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Order #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription className="text-sm">
              Placed on {selectedOrder && format(new Date(selectedOrder.created_at), 'PPP p')}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Status & Payment row */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
                {getPaymentMethodBadge(selectedOrder.payment_method || 'cod')}
              </div>

              {/* Customer Info Card */}
              <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{getCustomerName(selectedOrder)}</span>
                  </div>
                </div>
                {getCustomerPhone(selectedOrder) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${getCustomerPhone(selectedOrder)}`} 
                        className="text-sm text-primary hover:underline"
                      >
                        {getCustomerPhone(selectedOrder)}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(getCustomerPhone(selectedOrder))}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {selectedOrder.tracking_id && (
                <div className="p-3 bg-secondary/50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Tracking ID (Steadfast)</p>
                  <div className="flex items-center justify-between">
                    <code className="font-mono font-bold text-sm">{selectedOrder.tracking_id}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(selectedOrder.tracking_id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {selectedOrder.consignment_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Consignment: {selectedOrder.consignment_id}
                    </p>
                  )}
                </div>
              )}

              {selectedOrder.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                  <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                  <p className="text-sm text-destructive">{selectedOrder.rejection_reason}</p>
                </div>
              )}

              {/* Fraud Risk Analysis Panel */}
              {fraudAnalysisMap.get(selectedOrder.id) && (
                <FraudAnalysisPanel analysis={fraudAnalysisMap.get(selectedOrder.id)!} />
              )}
              
              {/* Shipping Address */}
              <div>
                <h4 className="font-medium text-sm mb-1.5">Shipping Address</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedOrder.shipping_address || 'No address provided'}
                </p>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-sm mb-2">Order Items</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium shrink-0 ml-2">৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-primary">৳{selectedOrder.total_amount}</span>
              </div>

              {/* Action buttons for pending orders */}
              {selectedOrder.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 h-11 active:scale-95 transition-transform"
                    onClick={() => {
                      setOrderForAction(selectedOrder);
                      setIsViewOpen(false);
                      setIsAcceptOpen(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1 h-11 active:scale-95 transition-transform"
                    onClick={() => {
                      setOrderForAction(selectedOrder);
                      setIsViewOpen(false);
                      setIsRejectOpen(true);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Order Dialog */}
      <AcceptOrderDialog
        isOpen={isAcceptOpen}
        onClose={() => {
          setIsAcceptOpen(false);
          setOrderForAction(null);
        }}
        order={orderForAction}
      />

      {/* Reject Order Dialog */}
      <RejectOrderDialog
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setOrderForAction(null);
        }}
        order={orderForAction}
      />
    </AdminLayout>
  );
};

export default AdminOrders;
