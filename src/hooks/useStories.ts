import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Story, StoryGroup, Pet } from '@/types/social';

export const useStories = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories' as any)
        .select(`
          *,
          pet:pets(*)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get viewed story IDs for current user
      let viewedStoryIds: Set<string> = new Set();
      if (user) {
        const { data: views } = await supabase
          .from('story_views' as any)
          .select('story_id')
          .eq('viewer_user_id', user.id);
        
        viewedStoryIds = new Set((views as any[])?.map(v => v.story_id) || []);
      }

      // Group stories by pet
      const groupedMap = new Map<string, StoryGroup>();
      
      for (const story of (data || []) as any[]) {
        if (!story.pet) continue;
        
        const petId = story.pet_id;
        const viewed = viewedStoryIds.has(story.id);
        
        if (!groupedMap.has(petId)) {
          groupedMap.set(petId, {
            pet: story.pet as Pet,
            stories: [],
            hasUnviewed: false,
          });
        }
        
        const group = groupedMap.get(petId)!;
        group.stories.push({ ...story, viewed } as Story);
        if (!viewed) {
          group.hasUnviewed = true;
        }
      }

      // Sort: unviewed first, then by latest story
      const groups = Array.from(groupedMap.values()).sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
      });

      setStoryGroups(groups);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching stories:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  const markAsViewed = async (storyId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('story_views' as any)
        .insert({ story_id: storyId, viewer_user_id: user.id });
    } catch (error) {
      // Ignore duplicate errors
    }
  };

  const createStory = async (petId: string, file: File, caption?: string) => {
    if (!user) return null;

    try {
      // Upload media
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/stories/${Date.now()}.${fileExt}`;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      const { error: uploadError } = await supabase.storage
        .from('pet-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-media')
        .getPublicUrl(fileName);

      // Create story
      const { data, error } = await supabase
        .from('stories' as any)
        .insert({
          pet_id: petId,
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchStories();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating story:', error);
      }
      return null;
    }
  };

  return { 
    storyGroups, 
    loading, 
    markAsViewed, 
    createStory,
    refresh: fetchStories 
  };
};
