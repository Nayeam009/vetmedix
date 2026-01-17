import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRoleType = 'user' | 'doctor' | 'clinic_owner' | 'admin' | 'moderator';

interface UserRoleData {
  roles: UserRoleType[];
  primaryRole: UserRoleType;
  isLoading: boolean;
  isUser: boolean;
  isDoctor: boolean;
  isClinicOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

// Priority order for determining primary role
const ROLE_PRIORITY: UserRoleType[] = ['admin', 'clinic_owner', 'doctor', 'moderator', 'user'];

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserRoleType[];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [] as UserRoleType[];
      }

      return (data?.map(r => r.role) as UserRoleType[]) || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const currentRoles = roles || [];
  
  // Determine primary role by priority
  const primaryRole = ROLE_PRIORITY.find(r => currentRoles.includes(r)) || 'user';

  return {
    roles: currentRoles,
    primaryRole,
    isLoading,
    isUser: currentRoles.length === 0 || currentRoles.includes('user'),
    isDoctor: currentRoles.includes('doctor'),
    isClinicOwner: currentRoles.includes('clinic_owner'),
    isAdmin: currentRoles.includes('admin'),
    isModerator: currentRoles.includes('moderator') || currentRoles.includes('admin'),
  };
};
