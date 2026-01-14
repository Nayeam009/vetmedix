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
  CheckCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdmin, useAdminStats } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

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
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's what's happening.">
      {/* E-Commerce Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <StatCard
          title="Total Revenue"
          value={`৳${stats?.totalRevenue?.toLocaleString() || 0}`}
          icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={<ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={<Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
          trend={{ value: 5.1, isPositive: true }}
        />
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
        <StatCard
          title="Total Clinics"
          value={stats?.totalClinics || 0}
          icon={<Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />}
          description={`${stats?.verifiedClinics || 0} verified`}
        />
        <StatCard
          title="Appointments"
          value={stats?.totalAppointments || 0}
          icon={<CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />}
          description={`${stats?.appointmentsToday || 0} today`}
        />
        <StatCard
          title="Social Posts"
          value={stats?.totalPosts || 0}
          icon={<MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />}
          description={`${stats?.postsToday || 0} today`}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Orders */}
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Recent Orders
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/orders')} className="text-xs sm:text-sm">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : stats?.recentOrders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {stats?.recentOrders?.map((order: any) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors gap-2 sm:gap-4">
                    <div className="flex items-center justify-between sm:block">
                      <p className="font-medium text-sm sm:text-base">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'PP')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                      <Badge className={`${getStatusColor(order.status)} text-xs`}>
                        {order.status}
                      </Badge>
                      <span className="font-bold text-primary text-sm sm:text-base">৳{order.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats & Actions */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Orders</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                {stats?.pendingOrders || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Verified Clinics</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                {stats?.verifiedClinics || 0} / {stats?.totalClinics || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Today's Appointments</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                {stats?.appointmentsToday || 0}
              </Badge>
            </div>
            
            <div className="pt-4 border-t border-border space-y-2 sm:space-y-3">
              <Button className="w-full text-sm" onClick={() => navigate('/admin/clinics')}>
                <Building2 className="h-4 w-4 mr-2" />
                Manage Clinics
              </Button>
              <Button variant="outline" className="w-full text-sm" onClick={() => navigate('/admin/social')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Moderate Social
              </Button>
              <Button variant="outline" className="w-full text-sm" onClick={() => navigate('/admin/products')}>
                <Package className="h-4 w-4 mr-2" />
                Manage Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
