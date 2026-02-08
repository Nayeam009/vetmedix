import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdmin, useAdminStats } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { ECommerceOverview } from '@/components/admin/dashboard/ECommerceOverview';
import { PlatformOverview } from '@/components/admin/dashboard/PlatformOverview';
import { RecentOrdersList } from '@/components/admin/dashboard/RecentOrdersList';
import { QuickActionsCard } from '@/components/admin/dashboard/QuickActionsCard';
import { PlatformHealthCard } from '@/components/admin/dashboard/PlatformHealthCard';

const AdminDashboard = () => {
  useDocumentTitle('Dashboard - Admin');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  // Realtime subscriptions
  useAdminRealtimeDashboard(isAdmin);

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

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your platform overview.">
      <ECommerceOverview stats={stats} />
      <PlatformOverview stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <RecentOrdersList orders={stats?.recentOrders} isLoading={statsLoading} />

        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <QuickActionsCard stats={stats} />
          <PlatformHealthCard stats={stats} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
