import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRoleType = 'user' | 'doctor' | 'clinic_owner' | 'admin' | 'moderator';

interface UserRoleData {
  role: UserRoleType;
  isLoading: boolean;
  isUser: boolean;
  isDoctor: boolean;
  isClinicOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'user' as UserRoleType;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'user' as UserRoleType;
      }

      return (data?.role as UserRoleType) || 'user';
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const currentRole = role || 'user';

  return {
    role: currentRole,
    isLoading,
    isUser: currentRole === 'user',
    isDoctor: currentRole === 'doctor',
    isClinicOwner: currentRole === 'clinic_owner',
    isAdmin: currentRole === 'admin',
    isModerator: currentRole === 'moderator',
  };
};
