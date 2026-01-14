import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'appointment' | 'order';
  title: string;
  message?: string;
  actorPetId?: string;
  targetPostId?: string;
  targetPetId?: string;
  targetOrderId?: string;
  targetAppointmentId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actor_pet_id: params.actorPetId,
        target_post_id: params.targetPostId,
        target_pet_id: params.targetPetId,
        target_order_id: params.targetOrderId,
        target_appointment_id: params.targetAppointmentId,
      });

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating notification:', error);
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating notification:', error);
    }
  }
};

// Get post owner's user_id for notifications
export const getPostOwnerUserId = async (postId: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
    
    return data?.user_id || null;
  } catch {
    return null;
  }
};

// Get pet owner's user_id for notifications
export const getPetOwnerUserId = async (petId: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('pets')
      .select('user_id')
      .eq('id', petId)
      .single();
    
    return data?.user_id || null;
  } catch {
    return null;
  }
};

// Create appointment status notification
export const createAppointmentNotification = async (params: {
  userId: string;
  appointmentId: string;
  clinicName: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  appointmentDate: string;
  appointmentTime: string;
}) => {
  const titles: Record<string, string> = {
    confirmed: '✅ Appointment Confirmed!',
    cancelled: '❌ Appointment Cancelled',
    completed: '🎉 Appointment Completed'
  };
  
  const messages: Record<string, string> = {
    confirmed: `Your appointment at ${params.clinicName} on ${params.appointmentDate} at ${params.appointmentTime} has been confirmed.`,
    cancelled: `Your appointment at ${params.clinicName} on ${params.appointmentDate} at ${params.appointmentTime} has been cancelled.`,
    completed: `Your appointment at ${params.clinicName} is complete. We hope your pet feels better!`
  };
  
  await createNotification({
    userId: params.userId,
    type: 'appointment',
    title: titles[params.status],
    message: messages[params.status],
    targetAppointmentId: params.appointmentId,
  });
};

// Create order status notification
export const createOrderNotification = async (params: {
  userId: string;
  orderId: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderTotal: number;
}) => {
  const titles: Record<string, string> = {
    processing: '📦 Order Processing',
    shipped: '🚚 Order Shipped!',
    delivered: '✅ Order Delivered!',
    cancelled: '❌ Order Cancelled'
  };
  
  const messages: Record<string, string> = {
    processing: `Your order of ৳${params.orderTotal.toLocaleString()} is being processed and will be shipped soon.`,
    shipped: `Your order of ৳${params.orderTotal.toLocaleString()} has been shipped and is on its way!`,
    delivered: `Your order of ৳${params.orderTotal.toLocaleString()} has been delivered. Enjoy!`,
    cancelled: `Your order of ৳${params.orderTotal.toLocaleString()} has been cancelled.`
  };
  
  await createNotification({
    userId: params.userId,
    type: 'order',
    title: titles[params.status],
    message: messages[params.status],
    targetOrderId: params.orderId,
  });
};
