import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialization: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  consultation_fee: number | null;
  is_available: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicDoctor {
  id: string;
  clinic_id: string;
  doctor_id: string;
  status: string;
  joined_at: string;
  doctor?: Doctor;
  clinic?: {
    id: string;
    name: string;
    address: string | null;
    image_url: string | null;
  };
}

export const useDoctor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: doctorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Doctor | null;
    },
    enabled: !!user?.id,
  });

  const { data: clinicAffiliations, isLoading: affiliationsLoading } = useQuery({
    queryKey: ['doctor-affiliations', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];

      const { data, error } = await supabase
        .from('clinic_doctors')
        .select(`
          *,
          clinic:clinics(id, name, address, image_url)
        `)
        .eq('doctor_id', doctorProfile.id);

      if (error) throw error;
      return data as ClinicDoctor[];
    },
    enabled: !!doctorProfile?.id,
  });

  const { data: doctorAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['doctor-appointments', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(id, name, address, phone)
        `)
        .eq('doctor_id', doctorProfile.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!doctorProfile?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Doctor>) => {
      if (!doctorProfile?.id) throw new Error('No doctor profile');

      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorProfile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error(error);
    },
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      toast.success('Appointment status updated');
    },
    onError: (error) => {
      toast.error('Failed to update appointment');
      console.error(error);
    },
  });

  return {
    doctorProfile,
    profileLoading,
    clinicAffiliations,
    affiliationsLoading,
    doctorAppointments,
    appointmentsLoading,
    updateProfile,
    updateAppointmentStatus,
  };
};

export const useDoctorById = (doctorId: string | undefined) => {
  return useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) return null;

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      return data as Doctor;
    },
    enabled: !!doctorId,
  });
};

export const useClinicDoctors = (clinicId: string | undefined) => {
  return useQuery({
    queryKey: ['clinic-doctors', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from('clinic_doctors')
        .select(`
          *,
          doctor:doctors(*)
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'active');

      if (error) throw error;
      return data as (ClinicDoctor & { doctor: Doctor })[];
    },
    enabled: !!clinicId,
  });
};
