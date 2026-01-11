import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation, Message, Pet } from '@/types/social';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations' as any)
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Enrich with other user's pets and last message
      const enriched = await Promise.all((data || []).map(async (conv: any) => {
        const otherUserId = conv.participant_1_id === user.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;

        // Get other user's pets
        const { data: pets } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', otherUserId)
          .limit(1);

        // Get last message
        const { data: messages } = await supabase
          .from('messages' as any)
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
        const { count } = await supabase
          .from('messages' as any)
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return {
          ...conv,
          other_user: {
            id: otherUserId,
            pets: (pets || []) as Pet[],
          },
          last_message: (messages?.[0] as unknown) as Message | undefined,
          unread_count: count || 0,
        } as Conversation;
      }));

      setConversations(enriched);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching conversations:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from('conversations' as any)
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) return (existing as any).id;

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations' as any)
        .insert({
          participant_1_id: user.id,
          participant_2_id: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchConversations();
      return (data as any).id;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error starting conversation:', error);
      }
      return null;
    }
  };

  return { conversations, loading, startConversation, refresh: fetchConversations };
};

export const useMessages = (conversationId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages' as any)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as unknown as Message[]);

      // Mark messages as read
      if (user) {
        await supabase
          .from('messages' as any)
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching messages:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string, mediaFile?: File) => {
    if (!user || !conversationId) return;

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/messages/${Date.now()}.${fileExt}`;
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';

        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      const { error } = await supabase
        .from('messages' as any)
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim() || null,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (error) throw error;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error sending message:', error);
      }
    }
  };

  return { messages, loading, sendMessage, refresh: fetchMessages };
};
