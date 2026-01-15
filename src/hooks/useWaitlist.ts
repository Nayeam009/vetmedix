import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WaitlistEntry {
  id: string;
  user_id: string;
  clinic_id: string;
  doctor_id: string | null;
  preferred_date: string;
  preferred_time: string;
  pet_name: string;
  pet_type: string;
  reason: string | null;
  status: 'waiting' | 'notified' | 'booked' | 'expired' | 'cancelled';
  notification_sent_at: string | null;
  expires_at: string | null;
  position: number | null;
  created_at: string;
  updated_at: string;
  clinic?: {
    name: string;
    address: string | null;
  };
}

export interface JoinWaitlistParams {
  clinicId: string;
  doctorId?: string;
  preferredDate: string;
  preferredTime: string;
  petName: string;
  petType: string;
  reason?: string;
}

export const useWaitlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userWaitlist, setUserWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's waitlist entries
  const fetchUserWaitlist = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_waitlist')
        .select(`
          *,
          clinic:clinics(name, address)
        `)
        .eq('user_id', user.id)
        .in('status', ['waiting', 'notified'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserWaitlist((data as unknown as WaitlistEntry[]) || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Join waitlist
  const joinWaitlist = async (params: JoinWaitlistParams): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to join the waitlist.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Check if already on waitlist for this slot
      const { data: existing } = await supabase
        .from('appointment_waitlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('clinic_id', params.clinicId)
        .eq('preferred_date', params.preferredDate)
        .eq('preferred_time', params.preferredTime)
        .in('status', ['waiting', 'notified'])
        .maybeSingle();

      if (existing) {
        toast({
          title: 'Already on waitlist',
          description: 'You are already on the waitlist for this time slot.',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('appointment_waitlist')
        .insert({
          user_id: user.id,
          clinic_id: params.clinicId,
          doctor_id: params.doctorId || null,
          preferred_date: params.preferredDate,
          preferred_time: params.preferredTime,
          pet_name: params.petName,
          pet_type: params.petType,
          reason: params.reason || null,
        });

      if (error) throw error;

      toast({
        title: 'Added to waitlist!',
        description: "We'll notify you when this slot becomes available.",
      });

      await fetchUserWaitlist();
      return true;
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to join waitlist. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Cancel waitlist entry
  const cancelWaitlistEntry = async (entryId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('appointment_waitlist')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Removed from waitlist',
        description: 'You have been removed from the waitlist.',
      });

      await fetchUserWaitlist();
      return true;
    } catch (error) {
      console.error('Error cancelling waitlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel waitlist entry.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Convert waitlist entry to appointment
  const convertToAppointment = async (entry: WaitlistEntry): Promise<boolean> => {
    if (!user) return false;

    try {
      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          clinic_id: entry.clinic_id,
          doctor_id: entry.doctor_id,
          appointment_date: entry.preferred_date,
          appointment_time: entry.preferred_time,
          pet_name: entry.pet_name,
          pet_type: entry.pet_type,
          reason: entry.reason,
        });

      if (appointmentError) throw appointmentError;

      // Update waitlist entry status
      const { error: waitlistError } = await supabase
        .from('appointment_waitlist')
        .update({ status: 'booked', updated_at: new Date().toISOString() })
        .eq('id', entry.id);

      if (waitlistError) throw waitlistError;

      toast({
        title: 'Appointment Booked!',
        description: 'Your appointment has been confirmed.',
      });

      await fetchUserWaitlist();
      return true;
    } catch (error) {
      console.error('Error converting to appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to book appointment. The slot may no longer be available.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get waitlist count for a specific slot
  const getSlotWaitlistCount = async (
    clinicId: string,
    date: string,
    time: string
  ): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('appointment_waitlist')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('preferred_date', date)
        .eq('preferred_time', time)
        .eq('status', 'waiting');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return 0;
    }
  };

  // Check if user is on waitlist for a specific slot
  const isUserOnWaitlist = async (
    clinicId: string,
    date: string,
    time: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('appointment_waitlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('clinic_id', clinicId)
        .eq('preferred_date', date)
        .eq('preferred_time', time)
        .in('status', ['waiting', 'notified'])
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking waitlist status:', error);
      return false;
    }
  };

  // Get booked appointments count for a slot (to determine if slot is full)
  const getSlotBookedCount = async (
    clinicId: string,
    date: string,
    time: string
  ): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .neq('status', 'cancelled');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting booked count:', error);
      return 0;
    }
  };

  // Set up realtime subscription for user's waitlist
  useEffect(() => {
    if (!user) return;

    fetchUserWaitlist();

    const channel = supabase
      .channel('user-waitlist')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_waitlist',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUserWaitlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    userWaitlist,
    loading,
    joinWaitlist,
    cancelWaitlistEntry,
    convertToAppointment,
    getSlotWaitlistCount,
    getSlotBookedCount,
    isUserOnWaitlist,
    refresh: fetchUserWaitlist,
  };
};
