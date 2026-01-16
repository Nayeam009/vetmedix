import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification, Pet } from '@/types/social';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // Use raw query to avoid type issues with new tables
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
      
      const notifs = (data || []) as unknown as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    if (user) {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  return { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    refresh: fetchNotifications 
  };
};
