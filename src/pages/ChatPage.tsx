import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, Loader2, Check, CheckCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import type { Pet } from '@/types/social';

const ChatPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(conversationId || '');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherPet, setOtherPet] = useState<Pet | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch conversation details to get other user's pet
    const fetchConversation = async () => {
      if (!conversationId || !user) return;

      const { data: conv } = await supabase
        .from('conversations' as any)
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conv) {
        const otherUserId = (conv as any).participant_1_id === user.id 
          ? (conv as any).participant_2_id 
          : (conv as any).participant_1_id;

        const { data: pets } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', otherUserId)
          .limit(1);

        if (pets?.[0]) {
          setOtherPet(pets[0] as Pet);
        }
      }
    };

    fetchConversation();
  }, [conversationId, user]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await sendMessage(newMessage);
    setNewMessage('');
    setSending(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    await sendMessage('', file);
    setSending(false);
    e.target.value = '';
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {otherPet && (
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/pet/${otherPet.id}`)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherPet.avatar_url || ''} />
              <AvatarFallback>{otherPet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{otherPet.name}</p>
              <p className="text-xs text-muted-foreground">{otherPet.species}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                    {message.media_url && (
                      <div className="mb-1">
                        {message.media_type === 'video' ? (
                          <video 
                            src={message.media_url} 
                            controls 
                            className="rounded-lg max-h-60"
                          />
                        ) : (
                          <img 
                            src={message.media_url} 
                            alt="" 
                            className="rounded-lg max-h-60 object-cover"
                          />
                        )}
                      </div>
                    )}
                    {message.content && (
                      <div className={`rounded-2xl px-4 py-2 ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-muted rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {isOwn && (
                        message.is_read 
                          ? <CheckCheck className="h-3 w-3 text-primary" />
                          : <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Image className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={sending}
            maxLength={1000}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ChatPage;
