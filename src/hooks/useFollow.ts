import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { createNotification, getPetOwnerUserId } from '@/lib/notifications';

export const useFollow = (petId: string) => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFollowStatus = async () => {
    try {
      // Check if current user follows this pet
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_user_id', user.id)
          .eq('following_pet_id', petId)
          .maybeSingle();

        setIsFollowing(!!followData);
      }

      // Get followers count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_pet_id', petId);

      setFollowersCount(followers || 0);

      // Get following count (pets this pet's owner follows)
      const { data: petData } = await supabase
        .from('pets')
        .select('user_id')
        .eq('id', petId)
        .single();

      if (petData) {
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_user_id', petData.user_id);

        setFollowingCount(following || 0);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching follow status:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (petId) {
      fetchFollowStatus();
    }
  }, [petId, user]);

  const follow = async (followerPetId?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .insert({ 
          follower_user_id: user.id, 
          follower_pet_id: followerPetId,
          following_pet_id: petId 
        });

      if (error) throw error;
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);

      // Create notification for the pet owner being followed
      const petOwnerId = await getPetOwnerUserId(petId);
      if (petOwnerId && petOwnerId !== user.id) {
        const actorPet = followerPetId || activePet?.id;
        const actorName = activePet?.name || 'Someone';
        await createNotification({
          userId: petOwnerId,
          type: 'follow',
          title: `${actorName} started following your pet`,
          actorPetId: actorPet,
          targetPetId: petId,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error following:', error);
      }
    }
  };

  const unfollow = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_user_id', user.id)
        .eq('following_pet_id', petId);

      if (error) throw error;
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error unfollowing:', error);
      }
    }
  };

  return { 
    isFollowing, 
    followersCount, 
    followingCount, 
    loading, 
    follow, 
    unfollow 
  };
};
