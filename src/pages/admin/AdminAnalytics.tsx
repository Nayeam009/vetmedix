import { useState, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  Building2,
  CalendarDays,
  PawPrint,
  Activity,
  BarChart3,
  PieChartIcon,
  ArrowUpRight,
  Stethoscope,
  RefreshCw,
  Mail,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AnalyticsStatCard } from '@/components/admin/AnalyticsStatCard';
import { AnalyticsChartCard } from '@/components/admin/AnalyticsChartCard';
import { AnalyticsDateFilter } from '@/components/admin/AnalyticsDateFilter';
import { AnalyticsExport } from '@/components/admin/AnalyticsExport';
import { AnalyticsPageSkeleton } from '@/components/admin/AnalyticsSkeleton';
import { LowStockAlert } from '@/components/admin/LowStockAlert';
import { VerificationFunnelSection } from '@/components/admin/VerificationFunnel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminAnalytics, type DateRangePreset } from '@/hooks/useAdminAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { format } from 'date-fns';

const formatCurrency = (value: number) => `৳${value.toLocaleString()}`;

const CustomTooltip = forwardRef<HTMLDivElement, any>(({ active, payload, label }, ref) => {
  if (active && payload && payload.length) {
    return (
      <div ref={ref} className="bg-card border border-border rounded-lg p-2 sm:p-3 shadow-lg">
        <p className="text-xs sm:text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-[10px] sm:text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.name.toLowerCase().includes('revenue') ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
});
CustomTooltip.displayName = 'CustomTooltip';

const AdminAnalytics = () => {
  useDocumentTitle('Analytics - Admin');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const { data: analytics, isLoading: analyticsLoading, dataUpdatedAt } = useAdminAnalytics(dateRange);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  const appointmentDistribution = useMemo(() => {
    if (!analytics) return [];
    const { appointmentStats } = analytics;
    return [
      { name: 'Completed', value: appointmentStats.completed, color: 'hsl(142, 71%, 45%)' },
      { name: 'Confirmed', value: appointmentStats.confirmed, color: 'hsl(217, 91%, 60%)' },
      { name: 'Pending', value: appointmentStats.pending, color: 'hsl(45, 93%, 47%)' },
      { name: 'Cancelled', value: appointmentStats.cancelled, color: 'hsl(0, 84%, 60%)' },
    ].filter(item => item.value > 0);
  }, [analytics]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  const lastUpdatedText = dataUpdatedAt
    ? `Updated ${format(new Date(dataUpdatedAt), 'h:mm a')}`
    : '';

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
        <div className="text-center p-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Analytics" subtitle="Track your business performance">
      {/* Header Controls: Date Filter + Export + Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <AnalyticsDateFilter value={dateRange} onChange={setDateRange} />
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdatedText && (
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
              {lastUpdatedText}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 sm:h-9 gap-1.5 text-xs sm:text-sm"
            disabled={analyticsLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <AnalyticsExport analytics={analytics} />
        </div>
      </div>

      {analyticsLoading ? (
        <AnalyticsPageSkeleton />
      ) : (
        <>
          {/* Low Stock Alerts */}
          {analytics && analytics.lowStockProducts.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <LowStockAlert products={analytics.lowStockProducts} />
            </div>
          )}

          {/* Key Revenue Metrics */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
              <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Revenue & Sales
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <AnalyticsStatCard
                title="Active Revenue"
                value={formatCurrency(analytics?.totalRevenue || 0)}
                icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />}
                trend={analytics?.revenueGrowth !== 0 ? { value: analytics?.revenueGrowth || 0, label: 'vs last month' } : undefined}
                subtitle={analytics?.cancelledRevenue ? `৳${analytics.cancelledRevenue.toLocaleString()} cancelled` : 'Excl. cancelled/rejected'}
                iconClassName="bg-emerald-100 dark:bg-emerald-900/30"
                className="bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50"
                href="/admin/orders"
              />
              <AnalyticsStatCard
                title="Total Orders"
                value={analytics?.totalOrders || 0}
                icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                trend={analytics?.orderGrowth !== 0 ? { value: analytics?.orderGrowth || 0, label: 'vs last month' } : undefined}
                subtitle={`${analytics?.activeOrders || 0} active · ${analytics?.cancelledOrders || 0} cancelled`}
                iconClassName="bg-blue-100 dark:bg-blue-900/30"
                className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-900/50"
                href="/admin/orders"
              />
              <AnalyticsStatCard
                title="Avg. Order Value"
                value={formatCurrency(Math.round(analytics?.averageOrderValue || 0))}
                icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
                subtitle="Active orders avg."
                iconClassName="bg-purple-100 dark:bg-purple-900/30"
                className="bg-gradient-to-br from-purple-50 to-violet-50/50 border-purple-100 dark:from-purple-950/30 dark:to-violet-950/20 dark:border-purple-900/50"
                href="/admin/orders"
              />
              <AnalyticsStatCard
                title="New Users"
                value={analytics?.newUsersThisMonth || 0}
                icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
                trend={analytics?.userGrowth !== 0 ? { value: analytics?.userGrowth || 0, label: 'this month' } : undefined}
                subtitle={`${analytics?.totalUsers || 0} total users`}
                iconClassName="bg-orange-100 dark:bg-orange-900/30"
                className="bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-100 dark:from-orange-950/30 dark:to-amber-950/20 dark:border-orange-900/50"
                href="/admin/customers"
              />
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="mb-4 sm:mb-6">
            <AnalyticsChartCard
              title="Revenue & Orders Trend"
              description={dateRange === 'all' ? 'Last 14 days performance' : `${dateRange === 'today' ? "Today's" : `Last ${dateRange.replace('days', ' days')}`} performance`}
              icon={<Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />}
            >
              <div className="h-[200px] sm:h-[280px] lg:h-[320px] -mx-2 sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics?.dailyTrends || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `৳${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      hide
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      fill="url(#colorOrders)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2 sm:mt-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Orders</span>
                </div>
              </div>
            </AnalyticsChartCard>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Order Status Distribution */}
            <AnalyticsChartCard
              title="Order Status"
              description="Distribution by status"
              icon={<PieChartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />}
              headerAction={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/orders')}
                  className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1"
                >
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              }
            >
              {(analytics?.orderStatusDistribution?.length || 0) > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-[160px] sm:h-[180px] w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.orderStatusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics?.orderStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [value, 'Orders']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-1.5 justify-center sm:w-1/2">
                    {analytics?.orderStatusDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{item.name}</span>
                        <span className="text-[10px] sm:text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-muted-foreground text-sm">
                  No order data available
                </div>
              )}
            </AnalyticsChartCard>

            {/* Category Sales */}
            <AnalyticsChartCard
              title="Sales by Category"
              description="Top performing categories"
              icon={<BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />}
              headerAction={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/products')}
                  className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1"
                >
                  Products
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              }
            >
              {(analytics?.categorySales?.length || 0) > 0 ? (
                <div className="h-[180px] sm:h-[200px] -mx-2 sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.categorySales}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `৳${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                  No category data available
                </div>
              )}
            </AnalyticsChartCard>
          </div>

          {/* Platform Stats */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
              <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Platform Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
              <AnalyticsStatCard
                title="Total Users"
                value={analytics?.totalUsers || 0}
                icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                subtitle={`${analytics?.newUsersThisMonth || 0} new this month`}
                iconClassName="bg-blue-100 dark:bg-blue-900/30"
                href="/admin/customers"
              />
              <AnalyticsStatCard
                title="Doctors"
                value={analytics?.totalDoctors || 0}
                icon={<Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />}
                subtitle={`${analytics?.verifiedDoctors || 0} verified`}
                iconClassName="bg-cyan-100 dark:bg-cyan-900/30"
                href="/admin/doctors"
              />
              <AnalyticsStatCard
                title="Clinics"
                value={analytics?.clinicStats.total || 0}
                icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />}
                subtitle={`${analytics?.clinicStats.verified || 0} verified`}
                iconClassName="bg-teal-100 dark:bg-teal-900/30"
                href="/admin/clinics"
              />
              <AnalyticsStatCard
                title="Appointments"
                value={analytics?.appointmentStats.total || 0}
                icon={<CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />}
                subtitle={`${analytics?.appointmentStats.completed || 0} completed`}
                iconClassName="bg-rose-100 dark:bg-rose-900/30"
                href="/admin/clinics"
              />
              <AnalyticsStatCard
                title="Products"
                value={analytics?.totalProducts || 0}
                icon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />}
                subtitle="Listed products"
                iconClassName="bg-indigo-100 dark:bg-indigo-900/30"
                href="/admin/products"
              />
              <AnalyticsStatCard
                title="Pets & Posts"
                value={analytics?.totalPets || 0}
                icon={<PawPrint className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
                subtitle={`${analytics?.totalPosts || 0} posts`}
                iconClassName="bg-amber-100 dark:bg-amber-900/30"
                href="/admin/social"
              />
              <AnalyticsStatCard
                title="Messages"
                value={analytics?.unreadMessages || 0}
                icon={<Mail className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />}
                subtitle="Unread contacts"
                iconClassName="bg-pink-100 dark:bg-pink-900/30"
              />
            </div>
          </div>

          {/* Verification Funnels */}
          {analytics && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Verification Pipeline
              </h2>
              <VerificationFunnelSection
                clinicFunnel={analytics.clinicVerificationFunnel}
                doctorFunnel={analytics.doctorVerificationFunnel}
              />
            </div>
          )}

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Products */}
            <AnalyticsChartCard
              title="Top Products"
              description="Best selling products"
              icon={<Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />}
            >
              {(analytics?.topProducts?.length || 0) > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {analytics?.topProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-bold text-primary">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{product.totalSold} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[160px] text-muted-foreground text-sm">
                  No product sales data
                </div>
              )}
            </AnalyticsChartCard>

            {/* Appointment Stats */}
            <AnalyticsChartCard
              title="Appointment Analytics"
              description="Status distribution & clinic health"
              icon={<CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />}
              headerAction={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/clinics')}
                  className="h-7 sm:h-8 text-[10px] sm:text-xs gap-1"
                >
                  Clinics
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              }
            >
              <div className="space-y-4">
                {appointmentDistribution.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-[120px] sm:h-[140px] w-full sm:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={appointmentDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {appointmentDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [value, 'Appointments']}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-1.5 justify-center sm:w-1/2">
                      {appointmentDistribution.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">{item.name}</span>
                          <span className="text-[10px] sm:text-xs font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
                    No appointment data
                  </div>
                )}

                {/* Clinic Health */}
                <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-border/50">
                  <div>
                    <div className="flex justify-between text-[10px] sm:text-xs mb-1">
                      <span className="text-muted-foreground">Clinic Verification Rate</span>
                      <span className="font-medium">
                        {analytics?.clinicStats.total
                          ? Math.round((analytics.clinicStats.verified / analytics.clinicStats.total) * 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress
                      value={
                        analytics?.clinicStats.total
                          ? (analytics.clinicStats.verified / analytics.clinicStats.total) * 100
                          : 0
                      }
                      className="h-1.5 sm:h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] sm:text-xs mb-1">
                      <span className="text-muted-foreground">Appointment Completion</span>
                      <span className="font-medium">
                        {analytics?.appointmentStats.total
                          ? Math.round(
                              (analytics.appointmentStats.completed / analytics.appointmentStats.total) * 100
                            )
                          : 0}%
                      </span>
                    </div>
                    <Progress
                      value={
                        analytics?.appointmentStats.total
                          ? (analytics.appointmentStats.completed / analytics.appointmentStats.total) * 100
                          : 0
                      }
                      className="h-1.5 sm:h-2"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs pt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                      {analytics?.clinicStats.pending || 0} pending
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
                      {analytics?.clinicStats.blocked || 0} blocked
                    </Badge>
                  </div>
                </div>
              </div>
            </AnalyticsChartCard>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminAnalytics;
