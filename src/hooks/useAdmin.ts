import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export type AppRole = 'admin' | 'moderator' | 'user' | 'doctor' | 'clinic_owner';

export const useAdmin = () => {
  const { roles, isLoading: roleLoading, isAdmin, isModerator, isClinicOwner, isDoctor } = useUserRole();

  return {
    userRoles: roles.map(r => ({ role: r })),
    roleLoading,
    isAdmin,
    isModerator,
    isClinicOwner,
    isDoctor,
    roles,
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
        supabase.from('orders').select('*', { count: 'exact', head: true }).is('trashed_at', null),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending').is('trashed_at', null),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['cancelled', 'rejected']).is('trashed_at', null),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('orders').select('id, total_amount, status, created_at').is('trashed_at', null).order('created_at', { ascending: false }).limit(5),
        // Only fetch amount+status for revenue calc — minimal columns
        supabase.from('orders').select('total_amount, status').is('trashed_at', null),
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
        .select('id, name, description, price, compare_price, category, product_type, image_url, stock, badge, discount, is_active, is_featured, sku, created_at')
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
        .select('id, user_id, items, total_amount, status, shipping_address, created_at, tracking_id, payment_method, payment_status, trashed_at, consignment_id, rejection_reason')
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
        .select('user_id, full_name, phone, avatar_url, address, division, district, thana, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles separately
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      
      // Use Map for O(1) lookups instead of O(n) filter per profile
      const roleMap = new Map<string, typeof roles>();
      for (const r of roles || []) {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r);
        roleMap.set(r.user_id, existing);
      }

      return profiles?.map(profile => ({
        ...profile,
        user_roles: roleMap.get(profile.user_id) || []
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
        .select('id, name, address, phone, email, image_url, is_verified, is_open, is_blocked, verification_status, rating, owner_user_id, owner_name, created_at, services, description, blocked_reason, rejection_reason')
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
