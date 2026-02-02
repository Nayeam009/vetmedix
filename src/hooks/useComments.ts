import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { createNotification, getPostOwnerUserId } from '@/lib/notifications';
import { commentSchema } from '@/lib/validations';
import { sanitizeText, isTextSafe } from '@/lib/sanitize';
import type { Comment } from '@/types/social';

export const useComments = (postId: string) => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          pet:pets(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data || []) as Comment[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching comments:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const addComment = async (content: string, commenterPetId?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Sanitize content before validation
    const sanitizedContent = sanitizeText(content, { maxLength: 2000, allowNewlines: false });
    
    // Check for dangerous content
    if (!isTextSafe(sanitizedContent)) {
      return { success: false, error: 'Comment contains invalid content' };
    }

    // Validate content with Zod schema
    const validation = commentSchema.safeParse({ content: sanitizedContent });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Invalid comment';
      return { success: false, error: errorMessage };
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ 
          post_id: postId, 
          user_id: user.id, 
          pet_id: commenterPetId,
          content: validation.data.content 
        })
        .select(`
          *,
          pet:pets(*)
        `)
        .single();

      if (error) throw error;
      setComments(prev => [...prev, data as Comment]);

      // Create notification for post owner
      const postOwnerId = await getPostOwnerUserId(postId);
      if (postOwnerId && postOwnerId !== user.id) {
        const actorPet = commenterPetId || activePet?.id;
        const actorName = activePet?.name || 'Someone';
        await createNotification({
          userId: postOwnerId,
          type: 'comment',
          title: `${actorName} commented on your post`,
          message: validation.data.content.slice(0, 100),
          actorPetId: actorPet,
          targetPostId: postId,
        });
      }
      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error adding comment:', error);
      }
      return { success: false, error: 'Failed to add comment' };
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  return { comments, loading, addComment, deleteComment, refreshComments: fetchComments };
};
