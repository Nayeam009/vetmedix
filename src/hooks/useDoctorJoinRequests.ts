import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DoctorJoinRequest {
  id: string;
  doctor_id: string;
  clinic_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: 'doctor' | 'clinic';
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  doctor?: {
    id: string;
    name: string;
    specialization: string | null;
    avatar_url: string | null;
    experience_years: number | null;
    qualifications: string[] | null;
  };
  clinic?: {
    id: string;
    name: string;
    address: string | null;
    image_url: string | null;
    is_verified: boolean;
  };
}

// Hook for doctors to manage their join requests
export const useDoctorJoinRequests = (doctorId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: joinRequests, isLoading } = useQuery({
    queryKey: ['doctor-join-requests', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .select(`
          *,
          clinic:clinics(id, name, address, image_url, is_verified)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DoctorJoinRequest[];
    },
    enabled: !!doctorId,
  });

  // For doctors to request joining a clinic
  const requestJoinClinic = useMutation({
    mutationFn: async ({ clinicId, message }: { clinicId: string; message?: string }) => {
      if (!doctorId) throw new Error('No doctor profile');

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .insert({
          doctor_id: doctorId,
          clinic_id: clinicId,
          requested_by: 'doctor',
          message: message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-join-requests'] });
      toast.success('Join request sent successfully');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('You already have a pending request for this clinic');
      } else {
        toast.error('Failed to send join request');
      }
      console.error(error);
    },
  });

  // For doctors to cancel their pending request
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('doctor_join_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-join-requests'] });
      toast.success('Request cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel request');
      console.error(error);
    },
  });

  return {
    joinRequests,
    isLoading,
    requestJoinClinic,
    cancelRequest,
  };
};

// Hook for clinic owners to manage join requests to their clinic
export const useClinicJoinRequests = (clinicId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: joinRequests, isLoading } = useQuery({
    queryKey: ['clinic-join-requests', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .select(`
          *,
          doctor:doctors(id, name, specialization, avatar_url, experience_years, qualifications)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DoctorJoinRequest[];
    },
    enabled: !!clinicId,
  });

  // For clinic owners to approve a join request
  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Get the request details first
      const { data: request, error: fetchError } = await supabase
        .from('doctor_join_requests')
        .select('doctor_id, clinic_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from('doctor_join_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add doctor to clinic_doctors table
      const { error: insertError } = await supabase
        .from('clinic_doctors')
        .insert({
          doctor_id: request.doctor_id,
          clinic_id: request.clinic_id,
          status: 'active',
        });

      if (insertError && insertError.code !== '23505') throw insertError;

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-doctors'] });
      toast.success('Doctor approved and added to clinic');
    },
    onError: (error) => {
      toast.error('Failed to approve request');
      console.error(error);
    },
  });

  // For clinic owners to reject a join request
  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('doctor_join_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-join-requests'] });
      toast.success('Request rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject request');
      console.error(error);
    },
  });

  // For clinic owners to invite a doctor
  const inviteDoctor = useMutation({
    mutationFn: async ({ doctorId, message }: { doctorId: string; message?: string }) => {
      if (!clinicId) throw new Error('No clinic');

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .insert({
          doctor_id: doctorId,
          clinic_id: clinicId,
          requested_by: 'clinic',
          message: message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-join-requests'] });
      toast.success('Invitation sent to doctor');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Already sent an invitation to this doctor');
      } else {
        toast.error('Failed to send invitation');
      }
      console.error(error);
    },
  });

  const pendingRequests = joinRequests?.filter(r => r.status === 'pending') || [];

  return {
    joinRequests,
    pendingRequests,
    isLoading,
    approveRequest,
    rejectRequest,
    inviteDoctor,
  };
};

// Hook to get verified clinics for doctors to browse
export const useVerifiedClinics = () => {
  return useQuery({
    queryKey: ['verified-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, image_url, phone, is_verified, rating, services')
        .eq('is_verified', true)
        .eq('is_blocked', false)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
