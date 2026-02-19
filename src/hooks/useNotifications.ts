import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types/social';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [] as Notification[];

      const { data, error } = await supabase
        .from('notifications' as any)
        .select(`
          *,
          actor_pet:pets!notifications_actor_pet_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate instead of optimistic set to get joined actor_pet data
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const notifications = data || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    // Optimistic update
    queryClient.setQueryData<Notification[]>(
      ['notifications', user.id],
      (old) => old?.map(n => n.id === notificationId ? { ...n, is_read: true } : n) || []
    );

    await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('id', notificationId);
  }, [user, queryClient]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    // Optimistic update
    queryClient.setQueryData<Notification[]>(
      ['notifications', user.id],
      (old) => old?.map(n => ({ ...n, is_read: true })) || []
    );

    await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }, [user, queryClient]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  }, [user?.id, queryClient]);

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};