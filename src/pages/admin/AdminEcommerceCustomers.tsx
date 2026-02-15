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
  Circle,
  CheckCircle2,
  X,
  Stethoscope,
  Building2,
  PawPrint,
  Calendar,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays, subMonths, subYears, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { downloadCSV } from '@/lib/csvParser';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';

type PaymentFilter = 'all' | 'paid' | 'unpaid';
type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all';

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
  roles: string[];
}

// --- Time Filter Component ---
const TimeFilterBar = ({ value, onChange }: { value: TimeFilter; onChange: (v: TimeFilter) => void }) => {
  const presets: { value: TimeFilter; label: string; short: string }[] = [
    { value: 'today', label: 'Today', short: 'Today' },
    { value: 'week', label: 'This Week', short: 'Week' },
    { value: 'month', label: 'This Month', short: 'Month' },
    { value: 'year', label: 'This Year', short: 'Year' },
    { value: 'all', label: 'All Time', short: 'All' },
  ];
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1 hidden sm:block" />
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            'px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all',
            value === p.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span className="sm:hidden">{p.short}</span>
          <span className="hidden sm:inline">{p.label}</span>
        </button>
      ))}
    </div>
  );
};

// --- Role Badge Component (colorful with icons) ---
const RoleBadge = ({ role }: { role: string }) => {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    admin: {
      label: 'Admin',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: <User className="h-2.5 w-2.5" />,
    },
    doctor: {
      label: 'Doctor',
      className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      icon: <Stethoscope className="h-2.5 w-2.5" />,
    },
    clinic_owner: {
      label: 'Clinic Owner',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: <Building2 className="h-2.5 w-2.5" />,
    },
    moderator: {
      label: 'Moderator',
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      icon: <User className="h-2.5 w-2.5" />,
    },
    user: {
      label: 'Pet Parent',
      className: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      icon: <PawPrint className="h-2.5 w-2.5" />,
    },
  };
  const c = config[role] || config.user;
  return (
    <Badge variant="outline" className={`${c.className} text-[10px] px-1.5 py-0 font-medium gap-0.5 border`}>
      {c.icon}
      {c.label}
    </Badge>
  );
};

// --- Payment Status Badge (clickable) ---
const PaymentStatusBadge = ({
  status,
  onUpdate,
  loading,
}: {
  status: string;
  onUpdate: (newStatus: string) => void;
  loading: boolean;
}) => {
  const badgeClass =
    status === 'paid'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : status === 'refunded'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';

  const label = status === 'paid' ? 'Paid' : status === 'refunded' ? 'Refunded' : 'Unpaid';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button disabled={loading} className="focus:outline-none">
          <Badge className={`${badgeClass} cursor-pointer hover:opacity-80 transition-opacity capitalize`}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : label}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {['paid', 'unpaid', 'refunded'].map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onUpdate(s)}
            className={`capitalize ${s === status ? 'font-bold' : ''}`}
          >
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Bulk Action Bar ---
const BulkActionBar = ({
  count,
  onClear,
  onBulkPayment,
  onExportSelected,
  loading,
}: {
  count: number;
  onClear: () => void;
  onBulkPayment: (status: string) => void;
  onExportSelected: () => void;
  loading: boolean;
}) => (
  <div className="flex items-center gap-2 flex-wrap bg-primary/5 border border-primary/20 rounded-xl p-2 sm:p-3 mb-4 animate-in slide-in-from-top-2">
    <span className="text-sm font-medium text-primary">{count} selected</span>
    <div className="flex gap-2 flex-wrap ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1" disabled={loading}>
            <CreditCard className="h-3.5 w-3.5" />
            Update Payment
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {['paid', 'unpaid', 'refunded'].map((s) => (
            <DropdownMenuItem key={s} onClick={() => onBulkPayment(s)} className="capitalize">
              Mark as {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1" onClick={onExportSelected}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
);

// --- Stat Card (inline, consistent with reference images) ---
const EcomStatCard = ({
  title,
  value,
  icon,
  active,
  onClick,
  ringColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  ringColor?: string;
}) => (
  <div
    onClick={onClick}
    className={cn(
      'bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all min-h-[80px] sm:min-h-[100px]',
      onClick && 'cursor-pointer active:scale-95 hover:shadow-md',
      active && `ring-2 ${ringColor || 'ring-primary'}`
    )}
  >
    <div className="mb-1.5">{icon}</div>
    <p className="text-lg sm:text-2xl font-bold leading-tight">{value}</p>
    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5 leading-tight">{title}</p>
  </div>
);

// --- Helper to get time cutoff ---
const getTimeCutoff = (filter: TimeFilter): Date | null => {
  const now = new Date();
  switch (filter) {
    case 'today': return startOfDay(now);
    case 'week': return startOfWeek(now, { weekStartsOn: 0 });
    case 'month': return startOfMonth(now);
    case 'year': return startOfYear(now);
    default: return null;
  }
};

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!authLoading && !roleLoading && !isAdmin) navigate('/');
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  // Fetch orders
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

  // Fetch profiles
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

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles-for-ecom'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('ecom-customers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ecommerce-customers'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomplete_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ecommerce-customers'] });
        queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, queryClient]);

  // Build role map
  const roleMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const r of userRoles || []) {
      if (!map[r.user_id]) map[r.user_id] = [];
      map[r.user_id].push(r.role);
    }
    return map;
  }, [userRoles]);

  // Filter orders by time
  const timeFilteredOrders = useMemo(() => {
    if (!orders) return [];
    const cutoff = getTimeCutoff(timeFilter);
    if (!cutoff) return orders;
    return orders.filter(o => isAfter(new Date(o.created_at), cutoff));
  }, [orders, timeFilter]);

  // Aggregate customers from time-filtered orders
  const customers = useMemo<EcomCustomer[]>(() => {
    if (!timeFilteredOrders.length) return [];
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const agg: Record<string, EcomCustomer> = {};

    for (const order of timeFilteredOrders) {
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
          roles: roleMap[uid] || ['user'],
        };
      }
      if (!isCancelled) {
        agg[uid].order_count += 1;
        agg[uid].total_spent += Number(order.total_amount) || 0;
      }
    }

    return Object.values(agg).filter(c => c.order_count > 0).sort((a, b) => b.total_spent - a.total_spent);
  }, [timeFilteredOrders, profiles, roleMap]);

  // Stats from time-filtered orders
  const stats = useMemo(() => {
    const activeOrders = timeFilteredOrders.filter(o => o.status !== 'cancelled');
    const totalSales = activeOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const paid = activeOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const pending = activeOrders.filter(o => o.payment_status === 'unpaid' || !o.payment_status).reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const uniqueUsers = new Set(activeOrders.map(o => o.user_id));
    return { totalSales, paid, pending, totalCustomers: uniqueUsers.size };
  }, [timeFilteredOrders]);

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

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(c => c.user_id)));
    }
  }, [paginatedData, selectedIds.size]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Update payment status
  const updatePaymentStatus = useCallback(async (userId: string, newStatus: string) => {
    setUpdatingPayment(userId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('user_id', userId)
        .neq('status', 'cancelled');
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: 'Updated', description: `Payment status set to ${newStatus}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update payment status', variant: 'destructive' });
    } finally {
      setUpdatingPayment(null);
    }
  }, [queryClient, toast]);

  // Bulk update
  const bulkUpdatePayment = useCallback(async (newStatus: string) => {
    if (!selectedIds.size) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      for (const uid of ids) {
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: newStatus })
          .eq('user_id', uid)
          .neq('status', 'cancelled');
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({ title: 'Bulk Update', description: `${ids.length} customers updated to ${newStatus}` });
      clearSelection();
    } catch {
      toast({ title: 'Error', description: 'Bulk update failed', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, queryClient, toast, clearSelection]);

  // Export
  const exportCustomers = useCallback((data: EcomCustomer[]) => {
    if (!data.length) return;
    const headers = ['Customer', 'Phone', 'Roles', 'Orders', 'Total Spent (BDT)', 'Payment Method', 'Payment Status', 'Last Order'];
    const rows = data.map(c => [
      c.full_name || 'Unnamed',
      c.phone || '',
      c.roles.join(', '),
      c.order_count.toString(),
      c.total_spent.toFixed(2),
      c.last_payment_method,
      c.last_payment_status,
      format(new Date(c.last_order_date), 'yyyy-MM-dd'),
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    downloadCSV(csvContent, `ecommerce-customers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({ title: 'Success', description: 'Customers exported to CSV' });
  }, [toast]);

  const handleExportCSV = useCallback(() => exportCustomers(filteredCustomers), [exportCustomers, filteredCustomers]);

  const handleExportSelected = useCallback(() => {
    const selected = filteredCustomers.filter(c => selectedIds.has(c.user_id));
    exportCustomers(selected);
  }, [exportCustomers, filteredCustomers, selectedIds]);

  const formatBDT = (amount: number) => `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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

  const isAllSelected = paginatedData.length > 0 && selectedIds.size === paginatedData.length;

  return (
    <AdminLayout title="E-Commerce Customers" subtitle="Payments, buyers & revenue overview">
      {/* Time Filter */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <TimeFilterBar value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Stats Cards - matching reference design */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <EcomStatCard
          title="Total Sales"
          value={formatBDT(stats.totalSales)}
          icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          active={paymentFilter === 'all'}
          onClick={() => setPaymentFilter('all')}
          ringColor="ring-primary"
        />
        <EcomStatCard
          title="Paid"
          value={formatBDT(stats.paid)}
          icon={<CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />}
          active={paymentFilter === 'paid'}
          onClick={() => setPaymentFilter('paid')}
          ringColor="ring-emerald-500"
        />
        <EcomStatCard
          title="Pending"
          value={formatBDT(stats.pending)}
          icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />}
          active={paymentFilter === 'unpaid'}
          onClick={() => setPaymentFilter('unpaid')}
          ringColor="ring-amber-500"
        />
        <EcomStatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />}
        />
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
          <Button variant="outline" onClick={handleExportCSV} disabled={!filteredCustomers.length} className="h-10 sm:h-11 rounded-xl text-sm gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onClear={clearSelection}
          onBulkPayment={bulkUpdatePayment}
          onExportSelected={handleExportSelected}
          loading={bulkLoading}
        />
      )}

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
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSelect(customer.user_id)} className="flex-shrink-0 text-muted-foreground">
                      {selectedIds.has(customer.user_id) ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{customer.full_name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                    </div>
                    <PaymentStatusBadge
                      status={customer.last_payment_status}
                      onUpdate={(s) => updatePaymentStatus(customer.user_id, s)}
                      loading={updatingPayment === customer.user_id}
                    />
                  </div>
                  {/* Role badges */}
                  <div className="flex gap-1 flex-wrap pl-7">
                    {customer.roles.map(r => <RoleBadge key={r} role={r} />)}
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
                    <TableHead className="w-10">
                      <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary transition-colors">
                        {isAllSelected ? <CheckCircle2 className="h-4.5 w-4.5 text-primary" /> : <Circle className="h-4.5 w-4.5" />}
                      </button>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Role</TableHead>
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
                        <button onClick={() => toggleSelect(customer.user_id)} className="text-muted-foreground hover:text-primary transition-colors">
                          {selectedIds.has(customer.user_id) ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                          ) : (
                            <Circle className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </TableCell>
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
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {customer.roles.map(r => <RoleBadge key={r} role={r} />)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{customer.order_count}</TableCell>
                      <TableCell className="text-right font-semibold">{formatBDT(customer.total_spent)}</TableCell>
                      <TableCell>
                        <span className="uppercase text-xs font-medium text-muted-foreground">{customer.last_payment_method}</span>
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge
                          status={customer.last_payment_status}
                          onUpdate={(s) => updatePaymentStatus(customer.user_id, s)}
                          loading={updatingPayment === customer.user_id}
                        />
                      </TableCell>
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
