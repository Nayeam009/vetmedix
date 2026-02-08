import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user' | 'doctor' | 'clinic_owner';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();

  const { data: userRoles, isLoading: roleLoading } = useQuery({
    queryKey: ['admin-roles-all', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data as UserRole[]) || [];
    },
    enabled: !!user,
  });

  const roles = userRoles || [];
  const roleTypes = roles.map(r => r.role);
  
  const isAdmin = roleTypes.includes('admin');
  const isModerator = roleTypes.includes('moderator') || isAdmin;
  const isClinicOwner = roleTypes.includes('clinic_owner');
  const isDoctor = roleTypes.includes('doctor');

  return {
    userRoles: roles,
    roleLoading,
    isAdmin,
    isModerator,
    isClinicOwner,
    isDoctor,
    roles: roleTypes,
  };
};

export const useAdminStats = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Single batch of all count + data queries
      const [
        { count: totalProducts },
        { count: totalUsers },
        { count: totalClinics },
        { count: totalDoctors },
        { count: totalPosts },
        { count: totalAppointments },
        { count: verifiedClinics },
        { count: pendingDoctors },
        { count: totalOrders },
        { count: pendingOrdersCount },
        { count: cancelledOrdersCount },
        { count: postsToday },
        { count: appointmentsToday },
        { data: recentOrders },
        { data: revenueRows },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('clinics').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['cancelled', 'rejected']),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('orders').select('id, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
        // Only fetch amount+status for revenue calc — minimal columns
        supabase.from('orders').select('total_amount, status'),
      ]);

      const rows = revenueRows || [];
      const activeRevenue = rows
        .filter(o => !['cancelled', 'rejected'].includes(o.status || ''))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalRevenue = rows.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const total = totalOrders || 0;
      const cancelled = cancelledOrdersCount || 0;
      const pending = pendingOrdersCount || 0;

      return {
        totalProducts: totalProducts || 0,
        totalOrders: total,
        activeOrders: total - cancelled,
        cancelledOrders: cancelled,
        totalUsers: totalUsers || 0,
        totalClinics: totalClinics || 0,
        verifiedClinics: verifiedClinics || 0,
        totalDoctors: totalDoctors || 0,
        pendingDoctors: pendingDoctors || 0,
        totalPosts: totalPosts || 0,
        postsToday: postsToday || 0,
        totalAppointments: totalAppointments || 0,
        appointmentsToday: appointmentsToday || 0,
        activeRevenue,
        totalRevenue,
        cancelledRevenue: totalRevenue - activeRevenue,
        pendingOrders: pending,
        recentOrders: recentOrders || [],
      };
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 2,
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
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles for all unique user_ids for fraud detection
      const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, phone: p.phone }])
      );

      // Attach profile to each order
      return (ordersData || []).map(order => ({
        ...order,
        profile: profileMap.get(order.user_id) || null,
      }));
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

export const useAdminClinics = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAdminPosts = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          pet:pets(id, name, avatar_url, user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAdminAppointments = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(id, name),
          doctor:doctors(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};
