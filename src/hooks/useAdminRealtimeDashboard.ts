import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Subscribes to realtime events for orders, clinics, and doctors
 * and invalidates relevant caches + shows toast notifications.
 */
export const useAdminRealtimeDashboard = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    };

    const channel = supabase
      .channel('admin-realtime-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        if ((payload.new as any).status === 'pending') {
          invalidateAll();
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          toast.info('🛒 New order received!', {
            action: {
              label: 'View',
              onClick: () => navigate('/admin/orders'),
            },
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clinics',
      }, (payload) => {
        if ((payload.new as any).verification_status === 'pending') {
          invalidateAll();
          queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
          toast.info('🏥 New clinic verification request!', {
            action: {
              label: 'Review',
              onClick: () => navigate('/admin/clinics'),
            },
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'doctors',
      }, (payload) => {
        if ((payload.new as any).verification_status === 'pending') {
          invalidateAll();
          queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
          toast.info('👨‍⚕️ New doctor verification request!', {
            action: {
              label: 'Review',
              onClick: () => navigate('/admin/doctors'),
            },
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient, navigate]);
};
