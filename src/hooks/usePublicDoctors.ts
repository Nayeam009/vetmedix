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

      // Fetch clinic-affiliated doctors
      const { data: affiliatedData, error: affiliatedError } = await supabase
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

      if (affiliatedError) throw affiliatedError;

      // Fetch independently verified doctors
      const { data: verifiedDoctors, error: verifiedError } = await supabase
        .from('doctors_public')
        .select('*')
        .eq('is_verified', true);

      if (verifiedError) throw verifiedError;

      // Build a map to deduplicate by doctor ID
      const doctorMap = new Map<string, PublicDoctor>();

      // Add clinic-affiliated doctors (from verified clinics only)
      (affiliatedData || [])
        .filter((item: any) => item.clinic?.is_verified === true && item.doctor)
        .forEach((item: any) => {
          doctorMap.set(item.doctor.id, {
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
          });
        });

      // Add independently verified doctors (if not already in map)
      // For these, we need to fetch their clinic affiliation if any
      for (const doctor of verifiedDoctors || []) {
        if (!doctorMap.has(doctor.id)) {
          // Check if they have any clinic affiliation
          const { data: affiliation } = await supabase
            .from('clinic_doctors')
            .select(`
              clinic:clinics(id, name, address, image_url, is_verified)
            `)
            .eq('doctor_id', doctor.id)
            .eq('status', 'active')
            .limit(1)
            .single();

          const clinic = affiliation?.clinic as any;
          
          doctorMap.set(doctor.id, {
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization,
            qualifications: doctor.qualifications,
            experience_years: doctor.experience_years,
            consultation_fee: doctor.consultation_fee,
            is_available: doctor.is_available,
            is_verified: doctor.is_verified,
            avatar_url: doctor.avatar_url,
            bio: doctor.bio,
            created_at: doctor.created_at,
            clinic_id: clinic?.id || '',
            clinic_name: clinic?.name || 'Independent Practice',
            clinic_address: clinic?.address || null,
            clinic_image_url: clinic?.image_url || null,
            clinic_is_verified: clinic?.is_verified || false,
          });
        }
      }

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
