import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  title: string;
  message?: string;
  actorPetId?: string;
  targetPostId?: string;
  targetPetId?: string;
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
