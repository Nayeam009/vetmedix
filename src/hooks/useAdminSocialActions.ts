import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from('comments').delete().eq('post_id', postId);
      await supabase.from('likes').delete().eq('post_id', postId);
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
      toast.success('Post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });
};

export const useDeletePet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (petId: string) => {
      await supabase.from('comments').delete().eq('pet_id', petId);
      await supabase.from('likes').delete().eq('pet_id', petId);
      const { data: petPosts } = await supabase.from('posts').select('id').eq('pet_id', petId);
      if (petPosts) {
        for (const post of petPosts) {
          await supabase.from('comments').delete().eq('post_id', post.id);
          await supabase.from('likes').delete().eq('post_id', post.id);
        }
      }
      await supabase.from('posts').delete().eq('pet_id', petId);
      await supabase.from('stories').delete().eq('pet_id', petId);
      await supabase.from('follows').delete().eq('following_pet_id', petId);
      await supabase.from('follows').delete().eq('follower_pet_id', petId);
      const { error } = await supabase.from('pets').delete().eq('id', petId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pet-parents'] });
      toast.success('Pet profile deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete pet profile');
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data: comment } = await supabase.from('comments').select('post_id').eq('id', commentId).single();
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      toast.success('Comment deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });
};
