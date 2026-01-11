import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useMessages';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, loading } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    navigate('/auth');
    return null;
  }

  const filteredConversations = conversations.filter(conv => {
    const petName = conv.other_user?.pets[0]?.name?.toLowerCase() || '';
    return petName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Start chatting by visiting a pet's profile and clicking "Message"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => {
              const pet = conv.other_user?.pets[0];
              return (
                <Card 
                  key={conv.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    conv.unread_count ? 'border-primary/50' : ''
                  }`}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={pet?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10">
                        {pet?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{pet?.name || 'Unknown'}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message?.content || 'No messages yet'}
                        </p>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MessagesPage;
