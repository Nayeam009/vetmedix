import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicDoctor {
  id: string;
  name: string;
  specialization: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  clinic_id: string;
  clinic_name: string;
  clinic_address: string | null;
  clinic_image_url: string | null;
  clinic_is_verified: boolean;
}

export const usePublicDoctors = () => {
  return useQuery({
    queryKey: ['public-doctors'],
    queryFn: async () => {
      // Fetch active doctors from verified clinics only
      const { data, error } = await supabase
        .from('clinic_doctors')
        .select(`
          clinic_id,
          status,
          doctor:doctors_public(
            id,
            name,
            specialization,
            qualifications,
            experience_years,
            consultation_fee,
            is_available,
            is_verified,
            avatar_url,
            bio,
            created_at
          ),
          clinic:clinics!inner(
            id,
            name,
            address,
            image_url,
            is_verified
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      // Transform and filter for verified clinics only
      const doctors: PublicDoctor[] = (data || [])
        .filter((item: any) => item.clinic?.is_verified === true && item.doctor)
        .map((item: any) => ({
          id: item.doctor.id,
          name: item.doctor.name,
          specialization: item.doctor.specialization,
          qualifications: item.doctor.qualifications,
          experience_years: item.doctor.experience_years,
          consultation_fee: item.doctor.consultation_fee,
          is_available: item.doctor.is_available,
          is_verified: item.doctor.is_verified,
          avatar_url: item.doctor.avatar_url,
          bio: item.doctor.bio,
          created_at: item.doctor.created_at,
          clinic_id: item.clinic.id,
          clinic_name: item.clinic.name,
          clinic_address: item.clinic.address,
          clinic_image_url: item.clinic.image_url,
          clinic_is_verified: item.clinic.is_verified,
        }));

      return doctors;
    },
  });
};

export const usePublicDoctorById = (doctorId: string | undefined) => {
  return useQuery({
    queryKey: ['public-doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) return null;

      // Get doctor basic info
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors_public')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (doctorError) throw doctorError;

      // Get clinic affiliations
      const { data: affiliations, error: affError } = await supabase
        .from('clinic_doctors')
        .select(`
          clinic_id,
          status,
          clinic:clinics!inner(
            id,
            name,
            address,
            phone,
            image_url,
            is_verified,
            is_open,
            opening_hours
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      if (affError) throw affError;

      // Get schedules
      const { data: schedules, error: schedError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId);

      if (schedError) throw schedError;

      return {
        ...doctor,
        affiliations: affiliations?.filter((a: any) => a.clinic?.is_verified) || [],
        schedules: schedules || [],
      };
    },
    enabled: !!doctorId,
  });
};
