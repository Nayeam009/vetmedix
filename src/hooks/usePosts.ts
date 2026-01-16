import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification, getPostOwnerUserId } from '@/lib/notifications';
import { usePets } from '@/contexts/PetContext';
import type { Post, Pet } from '@/types/social';

export const usePosts = (petId?: string, feedType: 'all' | 'following' | 'pet' = 'all') => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          pet:pets(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (feedType === 'pet' && petId) {
        query = query.eq('pet_id', petId);
      } else if (feedType === 'following' && user) {
        // Get followed pet IDs first
        const { data: follows } = await supabase
          .from('follows')
          .select('following_pet_id')
          .eq('follower_user_id', user.id);
        
        const followedIds = follows?.map(f => f.following_pet_id) || [];
        if (followedIds.length > 0) {
          query = query.in('pet_id', followedIds);
        } else {
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check if user liked each post
      let postsWithLikes = data || [];
      if (user && postsWithLikes.length > 0) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsWithLikes.map(p => p.id));

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
        postsWithLikes = postsWithLikes.map(post => ({
          ...post,
          liked_by_user: likedPostIds.has(post.id)
        }));
      }

      setPosts(postsWithLikes as Post[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching posts:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [petId, feedType, user]);

  const likePost = async (postId: string, likerPetId?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id, pet_id: likerPetId });

      if (error) throw error;
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + 1, liked_by_user: true }
          : post
      ));

      // Create notification for post owner
      const postOwnerId = await getPostOwnerUserId(postId);
      if (postOwnerId && postOwnerId !== user.id) {
        const actorPet = likerPetId || activePet?.id;
        const actorName = activePet?.name || 'Someone';
        await createNotification({
          userId: postOwnerId,
          type: 'like',
          title: `${actorName} liked your post`,
          actorPetId: actorPet,
          targetPostId: postId,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error liking post:', error);
      }
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: Math.max(0, post.likes_count - 1), liked_by_user: false }
          : post
      ));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error unliking post:', error);
      }
    }
  };

  return { posts, loading, likePost, unlikePost, refreshPosts: fetchPosts };
};
