import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRoleType = 'user' | 'doctor' | 'clinic_owner' | 'admin';

interface UserRoleData {
  roles: UserRoleType[];
  primaryRole: UserRoleType;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isUser: boolean;
  isDoctor: boolean;
  isClinicOwner: boolean;
  isAdmin: boolean;
  refetch: () => void;
}

// Priority order for determining primary role
const ROLE_PRIORITY: UserRoleType[] = ['admin', 'clinic_owner', 'doctor', 'user'];

export const useUserRole = (): UserRoleData => {
  const { user, loading: authLoading } = useAuth();

  const { data: roles, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user-roles-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserRoleType[];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching user roles:', error);
        throw error;
      }

      return (data?.map(r => r.role) as UserRoleType[]) || [];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const currentRoles = roles || [];
  
  // Determine primary role by priority
  const primaryRole = ROLE_PRIORITY.find(r => currentRoles.includes(r)) || 'user';

  return {
    roles: currentRoles,
    primaryRole,
    isLoading: isLoading || authLoading,
    isError,
    error: error as Error | null,
    isUser: currentRoles.length === 0 || currentRoles.includes('user'),
    isDoctor: currentRoles.includes('doctor'),
    isClinicOwner: currentRoles.includes('clinic_owner'),
    isAdmin: currentRoles.includes('admin'),
    refetch,
  };
};
