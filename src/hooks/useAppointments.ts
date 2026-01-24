import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getClinicOwnerUserId, createNotification } from '@/lib/notifications';

export const useAppointmentActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const cancelAppointment = useMutation({
    mutationFn: async ({ 
      appointmentId, 
      clinicId, 
      clinicName 
    }: { 
      appointmentId: string; 
      clinicId: string;
      clinicName?: string;
    }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Notify clinic owner about cancellation
      const clinicOwnerId = await getClinicOwnerUserId(clinicId);
      if (clinicOwnerId) {
        await createNotification({
          userId: clinicOwnerId,
          type: 'appointment',
          title: 'Appointment Cancelled',
          message: `A patient has cancelled their appointment${clinicName ? ` at ${clinicName}` : ''}.`,
          targetAppointmentId: appointmentId,
          targetClinicId: clinicId,
        });
      }

      return { appointmentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['userAppointments'] });
      toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been cancelled successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to cancel appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    cancelAppointment,
  };
};
