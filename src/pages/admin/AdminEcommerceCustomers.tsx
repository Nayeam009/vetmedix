import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  AlertCircle,
  Users,
  Download,
  DollarSign,
  CreditCard,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  User,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { downloadCSV } from '@/lib/csvParser';
import { usePagination } from '@/hooks/usePagination';

type PaymentFilter = 'all' | 'paid' | 'unpaid';

interface EcomCustomer {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  order_count: number;
  total_spent: number;
  last_order_date: string;
  last_payment_status: string;
  last_payment_method: string;
}

const AdminEcommerceCustomers = () => {
  useDocumentTitle('E-Commerce Customers - Admin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!authLoading && !roleLoading && !isAdmin) navigate('/');
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  // Fetch orders with profile data
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-ecommerce-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('user_id, total_amount, payment_status, payment_method, created_at, status')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-for-ecom'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, avatar_url');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Realtime subscription for orders
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('ecom-customers-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ecommerce-customers'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, queryClient]);

  // Aggregate customers from orders (exclude cancelled orders from spending)
  const customers = useMemo<EcomCustomer[]>(() => {
    if (!orders) return [];
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const agg: Record<string, EcomCustomer> = {};

    for (const order of orders) {
      const uid = order.user_id;
      const isCancelled = order.status === 'cancelled';
      if (!agg[uid]) {
        const profile = profileMap.get(uid);
        agg[uid] = {
          user_id: uid,
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
          order_count: 0,
          total_spent: 0,
          last_order_date: order.created_at,
          last_payment_status: order.payment_status || 'unpaid',
          last_payment_method: order.payment_method || 'cod',
        };
      }
      // Only count non-cancelled orders for spending and order count
      if (!isCancelled) {
        agg[uid].order_count += 1;
        agg[uid].total_spent += Number(order.total_amount) || 0;
      }
    }

    // Only include customers who have at least one non-cancelled order
    return Object.values(agg).filter(c => c.order_count > 0).sort((a, b) => b.total_spent - a.total_spent);
  }, [orders, profiles]);

  // Stats (exclude cancelled orders from all revenue calculations)
  const stats = useMemo(() => {
    if (!orders) return { totalSales: 0, paid: 0, pending: 0, totalCustomers: 0 };
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const paid = activeOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const pending = activeOrders.filter(o => o.payment_status === 'unpaid' || !o.payment_status).reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const uniqueUsers = new Set(activeOrders.map(o => o.user_id));
    return { totalSales, paid, pending, totalCustomers: uniqueUsers.size };
  }, [orders]);

  // Filter
  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.full_name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
      );
    }
    if (paymentFilter !== 'all') {
      result = result.filter(c => c.last_payment_status === paymentFilter);
    }
    return result;
  }, [customers, searchQuery, paymentFilter]);

  const {
    paginatedData,
    currentPage,
    totalPages,
    previousPage,
    nextPage,
    hasPreviousPage,
    hasNextPage,
    startIndex,
  } = usePagination({ data: filteredCustomers, pageSize: 20 });

  const handleExportCSV = useCallback(() => {
    if (!filteredCustomers.length) return;
    const headers = ['Customer', 'Phone', 'Orders', 'Total Spent (BDT)', 'Payment Method', 'Payment Status', 'Last Order'];
    const rows = filteredCustomers.map(c => [
      c.full_name || 'Unnamed',
      c.phone || '',
      c.order_count.toString(),
      c.total_spent.toFixed(2),
      c.last_payment_method,
      c.last_payment_status,
      format(new Date(c.last_order_date), 'yyyy-MM-dd'),
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    downloadCSV(csvContent, `ecommerce-customers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({ title: 'Success', description: 'Customers exported to CSV' });
  }, [filteredCustomers, toast]);

  const formatBDT = (amount: number) => `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const getPaymentBadge = (status: string) => {
    if (status === 'paid') return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Paid</Badge>;
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Unpaid</Badge>;
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
    <AdminLayout title="E-Commerce Customers" subtitle="Payments, buyers & revenue overview">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div onClick={() => setPaymentFilter('all')} className={`cursor-pointer rounded-xl sm:rounded-2xl transition-all active:scale-95 ${paymentFilter === 'all' ? 'ring-2 ring-primary' : ''}`}>
          <StatCard
            title="Total Sales"
            value={formatBDT(stats.totalSales)}
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          />
        </div>
        <div onClick={() => setPaymentFilter('paid')} className={`cursor-pointer rounded-xl sm:rounded-2xl transition-all active:scale-95 ${paymentFilter === 'paid' ? 'ring-2 ring-emerald-500' : ''}`}>
          <StatCard
            title="Paid"
            value={formatBDT(stats.paid)}
            icon={<CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />}
          />
        </div>
        <div onClick={() => setPaymentFilter('unpaid')} className={`cursor-pointer rounded-xl sm:rounded-2xl transition-all active:scale-95 ${paymentFilter === 'unpaid' ? 'ring-2 ring-amber-500' : ''}`}>
          <StatCard
            title="Pending"
            value={formatBDT(stats.pending)}
            icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
          />
        </div>
        <div className="rounded-xl sm:rounded-2xl">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
          />
        </div>
      </div>

      {/* Search + Filter + Export */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
            <SelectTrigger className="w-[130px] sm:w-[150px] h-10 sm:h-11 rounded-xl text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!filteredCustomers.length}
            className="h-10 sm:h-11 rounded-xl text-sm gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
        Showing {paginatedData.length ? startIndex + 1 : 0}–{startIndex + paginatedData.length} of {filteredCustomers.length} customers
      </p>

      {/* Table */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border">
              {paginatedData.map((customer) => (
                <div key={customer.user_id} className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{customer.full_name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                    </div>
                    {getPaymentBadge(customer.last_payment_status)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Orders</p>
                      <p className="font-semibold">{customer.order_count}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-semibold">{formatBDT(customer.total_spent)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground">Method</p>
                      <p className="font-semibold uppercase">{customer.last_payment_method}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Last order: {format(new Date(customer.last_order_date), 'PP')}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Last Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((customer) => (
                    <TableRow key={customer.user_id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{customer.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{customer.order_count}</TableCell>
                      <TableCell className="text-right font-semibold">{formatBDT(customer.total_spent)}</TableCell>
                      <TableCell>
                        <span className="uppercase text-xs font-medium text-muted-foreground">{customer.last_payment_method}</span>
                      </TableCell>
                      <TableCell>{getPaymentBadge(customer.last_payment_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(customer.last_order_date), 'PP')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousPage} disabled={!hasPreviousPage} className="h-9 rounded-xl gap-1">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage} className="h-9 rounded-xl gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEcommerceCustomers;
