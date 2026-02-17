import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Centralized realtime subscription for ALL admin pages.
 * Subscribes to all admin-relevant tables and invalidates caches + shows toasts.
 */
export const useAdminRealtimeDashboard = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    };

    const channel = supabase
      .channel('admin-realtime-dashboard')
      // Orders
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        if ((payload.new as any).status === 'pending') {
          invalidateAll();
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          toast.info('🛒 New order received!', {
            action: { label: 'View', onClick: () => navigate('/admin/orders') },
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-ecommerce-customers'] });
      })
      // Clinics
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, (payload) => {
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
        queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
        if (payload.eventType === 'UPDATE' && (payload.new as any).verification_status === 'pending') {
          toast.info('🏥 New clinic verification request!', {
            action: { label: 'Review', onClick: () => navigate('/admin/clinics') },
          });
        }
      })
      // Doctors
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, (payload) => {
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
        if (payload.eventType === 'UPDATE' && (payload.new as any).verification_status === 'pending') {
          toast.info('👨‍⚕️ New doctor verification request!', {
            action: { label: 'Review', onClick: () => navigate('/admin/doctors') },
          });
        }
      })
      // Products
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      })
      // Profiles (customers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        invalidateAll();
      })
      // Posts (social)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
        queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
        invalidateAll();
      })
      // Contact messages
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
        invalidateAll();
        if (payload.eventType === 'INSERT') {
          toast.info('📩 New contact message!', {
            action: { label: 'View', onClick: () => navigate('/admin/contact-messages') },
          });
        }
      })
      // Coupons
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
        invalidateAll();
      })
      // Incomplete orders
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomplete_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
        invalidateAll();
      })
      // Appointments
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
        invalidateAll();
      })
      // Delivery zones
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_zones' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
        invalidateAll();
      })
      // Clinic reviews
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_reviews' }, () => {
        queryClient.invalidateQueries({ queryKey: ['clinic-reviews'] });
        queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
        invalidateAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient, navigate]);
};
