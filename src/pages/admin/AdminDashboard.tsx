import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Building2,
  MessageSquare,
  CalendarDays,
  ExternalLink,
  ArrowUpRight,
  Heart,
  PawPrint,
  Image,
  CheckCircle2,
  XCircle,
  Truck,
  Star,
  Stethoscope
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAdmin, useAdminStats } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  useEffect(() => {
    document.title = 'Dashboard - VetMedix Admin';
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

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
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'shipped':
        return <Truck className="h-3.5 w-3.5" />;
      case 'cancelled':
        return <XCircle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your platform overview.">
      {/* Revenue & Orders Overview */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">E-Commerce Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <StatCard
            title="Total Revenue"
            value={`৳${stats?.totalRevenue?.toLocaleString() || 0}`}
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />}
            trend={{ value: 12.5, isPositive: true }}
            href="/admin/analytics"
            className="bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50"
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
            trend={{ value: 8.2, isPositive: true }}
            href="/admin/orders"
            className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-900/50"
          />
          <StatCard
            title="Products"
            value={stats?.totalProducts || 0}
            icon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
            href="/admin/products"
            className="bg-gradient-to-br from-purple-50 to-violet-50/50 border-purple-100 dark:from-purple-950/30 dark:to-violet-950/20 dark:border-purple-900/50"
          />
          <StatCard
            title="Pending"
            value={stats?.pendingOrders || 0}
            icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
            href="/admin/orders?status=pending"
            className="bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50"
          />
        </div>
      </div>

      {/* Platform Stats */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">Platform Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          <StatCard
            title="Doctors"
            value={stats?.totalDoctors || 0}
            icon={<Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />}
            description={`${stats?.pendingDoctors || 0} pending`}
            href="/admin/doctors"
            className="bg-gradient-to-br from-cyan-50 to-sky-50/50 border-cyan-100 dark:from-cyan-950/30 dark:to-sky-950/20 dark:border-cyan-900/50"
          />
          <StatCard
            title="Clinics"
            value={stats?.totalClinics || 0}
            icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />}
            description={`${stats?.verifiedClinics || 0} verified`}
            href="/admin/clinics"
            className="bg-gradient-to-br from-teal-50 to-cyan-50/50 border-teal-100 dark:from-teal-950/30 dark:to-cyan-950/20 dark:border-teal-900/50"
          />
          <StatCard
            title="Appointments"
            value={stats?.totalAppointments || 0}
            icon={<CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />}
            description={`${stats?.appointmentsToday || 0} today`}
            href="/admin/clinics"
            className="bg-gradient-to-br from-rose-50 to-pink-50/50 border-rose-100 dark:from-rose-950/30 dark:to-pink-950/20 dark:border-rose-900/50"
          />
          <StatCard
            title="Posts"
            value={stats?.totalPosts || 0}
            icon={<MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />}
            description={`${stats?.postsToday || 0} today`}
            href="/admin/social"
            className="bg-gradient-to-br from-indigo-50 to-purple-50/50 border-indigo-100 dark:from-indigo-950/30 dark:to-purple-950/20 dark:border-indigo-900/50"
          />
          <StatCard
            title="Users"
            value={stats?.totalUsers || 0}
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
            trend={{ value: 5.1, isPositive: true }}
            href="/admin/customers"
            className="bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-100 dark:from-orange-950/30 dark:to-amber-950/20 dark:border-orange-900/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 lg:p-5 pb-0">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Recent Orders</span>
              </CardTitle>
              <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm hidden sm:block">Latest customer orders</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')} className="gap-1 text-xs sm:text-sm h-8 px-2 sm:px-3 flex-shrink-0">
              <span className="hidden xs:inline">View All</span>
              <span className="xs:hidden">All</span>
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-5">
            {statsLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
              </div>
            ) : stats?.recentOrders?.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.recentOrders?.map((order: any) => (
                  <div 
                    key={order.id} 
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center justify-between p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-2 sm:gap-3 cursor-pointer group border border-transparent hover:border-border/50 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm group-hover:text-primary transition-colors truncate">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <Badge className={`${getStatusColor(order.status)} text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5`}>
                        {getStatusIcon(order.status)}
                        <span className="hidden xs:inline">{order.status}</span>
                        <span className="xs:hidden">{order.status.slice(0, 3)}</span>
                      </Badge>
                      <span className="font-bold text-primary text-xs sm:text-sm whitespace-nowrap">৳{order.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-5 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-5 pt-0 space-y-1.5 sm:space-y-2">
              <Button 
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-2.5" 
                variant="outline"
                onClick={() => navigate('/admin/orders?status=pending')}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
                </div>
                <span className="flex-1 text-left text-xs sm:text-sm truncate">Pending Orders</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] sm:text-xs px-1.5 sm:px-2 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                  {stats?.pendingOrders || 0}
                </Badge>
              </Button>
              
              <Button 
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-2.5" 
                variant="outline"
                onClick={() => navigate('/admin/clinics')}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                </div>
                <span className="flex-1 text-left text-xs sm:text-sm truncate">Manage Clinics</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] sm:text-xs px-1.5 sm:px-2 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                  {stats?.verifiedClinics || 0}/{stats?.totalClinics || 0}
                </Badge>
              </Button>
              
              <Button 
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-2.5" 
                variant="outline"
                onClick={() => navigate('/admin/doctors')}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600" />
                </div>
                <span className="flex-1 text-left text-xs sm:text-sm truncate">Doctor Verifications</span>
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] sm:text-xs px-1.5 sm:px-2 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800">
                  {stats?.pendingDoctors || 0} pending
                </Badge>
              </Button>
              
              <Button 
                className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-2.5" 
                variant="outline"
                onClick={() => navigate('/admin/social')}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <span className="flex-1 text-left text-xs sm:text-sm truncate">Moderate Social</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] sm:text-xs px-1.5 sm:px-2 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800">
                  {stats?.postsToday || 0} new
                </Badge>
              </Button>
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-5 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-5 pt-0 space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
                  <span className="text-muted-foreground">Clinic Verification</span>
                  <span className="font-medium">
                    {stats?.totalClinics 
                      ? Math.round((stats.verifiedClinics || 0) / stats.totalClinics * 100) 
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats?.totalClinics 
                    ? ((stats.verifiedClinics || 0) / stats.totalClinics * 100) 
                    : 0} 
                  className="h-1.5 sm:h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
                  <span className="text-muted-foreground">Order Fulfillment</span>
                  <span className="font-medium">
                    {stats?.totalOrders 
                      ? Math.round(((stats.totalOrders - (stats.pendingOrders || 0)) / stats.totalOrders) * 100) 
                      : 100}%
                  </span>
                </div>
                <Progress 
                  value={stats?.totalOrders 
                    ? (((stats.totalOrders - (stats.pendingOrders || 0)) / stats.totalOrders) * 100) 
                    : 100} 
                  className="h-1.5 sm:h-2"
                />
              </div>

              <div className="pt-2 sm:pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Today's Activity</span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-500" />
                      {stats?.postsToday || 0}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <CalendarDays className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-rose-500" />
                      {stats?.appointmentsToday || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
