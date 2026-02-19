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
      // Strategy: Fetch doctors from two sources and merge:
      // 1. Doctors affiliated with verified clinics (via clinic_doctors)
      // 2. Independently verified doctors (is_verified = true)

      // Fetch clinic-affiliated doctors - public policy allows anon access to active affiliations
      const { data: clinicDoctorsData, error: cdError } = await supabase
        .from('clinic_doctors')
        .select(`
          clinic_id,
          doctor_id,
          status,
          clinic:clinics!inner(
            id,
            name,
            address,
            image_url,
            is_verified
          )
        `)
        .eq('status', 'active');

      if (cdError) {
        console.error('[usePublicDoctors] clinic_doctors query failed:', cdError.message, cdError);
        throw cdError;
      }
      console.debug('[usePublicDoctors] clinic_doctors rows:', clinicDoctorsData?.length ?? 0);

      // Get doctor IDs from active clinic affiliations with verified clinics
      const verifiedClinicDoctorIds = (clinicDoctorsData || [])
        .filter((item: any) => item.clinic?.is_verified === true)
        .map((item: any) => item.doctor_id);

      // Fetch all doctors from the public view
      const { data: allDoctors, error: doctorsError } = await supabase
        .from('doctors_public')
        .select('id, name, specialization, qualifications, avatar_url, bio, experience_years, consultation_fee, is_available, is_verified, created_by_clinic_id, created_at, updated_at');

      if (doctorsError) {
        console.error('[usePublicDoctors] doctors_public query failed:', doctorsError.message, doctorsError);
        throw doctorsError;
      }
      console.debug('[usePublicDoctors] doctors_public rows:', allDoctors?.length ?? 0);

      // Build a map to deduplicate by doctor ID
      const doctorMap = new Map<string, PublicDoctor>();

      // Create a clinic lookup map
      const clinicLookup = new Map<string, any>();
      (clinicDoctorsData || []).forEach((item: any) => {
        if (item.clinic?.is_verified) {
          clinicLookup.set(item.doctor_id, item.clinic);
        }
      });

      // Add clinic-affiliated doctors (from verified clinics only)
      (allDoctors || [])
        .filter((doc: any) => verifiedClinicDoctorIds.includes(doc.id) || doc.is_verified)
        .forEach((doc: any) => {
          const clinic = clinicLookup.get(doc.id);
          doctorMap.set(doc.id, {
            id: doc.id,
            name: doc.name,
            specialization: doc.specialization,
            qualifications: doc.qualifications,
            experience_years: doc.experience_years,
            consultation_fee: doc.consultation_fee,
            is_available: doc.is_available,
            is_verified: doc.is_verified,
            avatar_url: doc.avatar_url,
            bio: doc.bio,
            created_at: doc.created_at,
            clinic_id: clinic?.id || '',
            clinic_name: clinic?.name || 'Independent Practice',
            clinic_address: clinic?.address || null,
            clinic_image_url: clinic?.image_url || null,
            clinic_is_verified: clinic?.is_verified || false,
          });
        });

      return Array.from(doctorMap.values());
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
        .select('id, name, specialization, qualifications, avatar_url, bio, experience_years, consultation_fee, is_available, is_verified, created_by_clinic_id, created_at, updated_at')
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
        .select('id, doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, max_appointments')
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
