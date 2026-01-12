import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!user,
  });

  const isAdmin = userRole?.role === 'admin';
  const isModerator = userRole?.role === 'moderator' || isAdmin;

  return {
    userRole,
    roleLoading,
    isAdmin,
    isModerator,
    role: userRole?.role || null,
  };
};

export const useAdminStats = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: totalOrders },
        { count: totalUsers },
        { data: recentOrders },
        { data: orderStats },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('total_amount, status'),
      ]);

      const totalRevenue = orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const pendingOrders = orderStats?.filter(o => o.status === 'pending').length || 0;

      return {
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalUsers: totalUsers || 0,
        totalRevenue,
        pendingOrders,
        recentOrders: recentOrders || [],
      };
    },
    enabled: isAdmin,
  });
};

export const useAdminProducts = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAdminOrders = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAdminUsers = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles separately
      const { data: roles } = await supabase.from('user_roles').select('*');
      
      return profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.user_id) || []
      }));
    },
    enabled: isAdmin,
  });
};
