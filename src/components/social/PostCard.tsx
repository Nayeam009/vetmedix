import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CommentsSection } from './CommentsSection';
import type { Post } from '@/types/social';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onDelete?: () => void;
}

export const PostCard = ({ post, onLike, onUnlike, onDelete }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like posts');
      navigate('/auth');
      return;
    }
    setIsLiking(true);
    setTimeout(() => setIsLiking(false), 300);
    
    if (post.liked_by_user) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleDelete = async () => {
    if (!user || post.user_id !== user.id) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      toast.success('Post deleted');
      onDelete?.();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${post.pet?.name}'s post`,
        text: post.content || '',
        url: window.location.origin + `/post/${post.id}`,
      });
    } catch {
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-soft hover:shadow-card transition-all duration-300 bg-card rounded-xl">
      {/* Compact Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate(`/pet/${post.pet_id}`)}
        >
          <div className="p-0.5 rounded-full bg-gradient-to-br from-primary to-accent">
            <Avatar className="h-9 w-9 border-2 border-card">
              <AvatarImage src={post.pet?.avatar_url || ''} alt={post.pet?.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-xs">
                {post.pet?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1">
              {post.pet?.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        {user?.id === post.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border shadow-lg rounded-lg">
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive focus:text-destructive rounded-md text-sm"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="px-3 pb-2 pt-0">
        {post.content && (
          <p className="text-sm mb-2 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        )}
        
        {post.media_urls && post.media_urls.length > 0 && (
          <div className={`grid gap-0.5 rounded-xl overflow-hidden ${
            post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {post.media_urls.slice(0, 4).map((url, index) => (
              <div 
                key={index} 
                className={`relative overflow-hidden ${
                  post.media_urls.length === 3 && index === 0 ? 'row-span-2' : ''
                } ${post.media_urls.length === 1 ? 'aspect-video' : 'aspect-square'}`}
              >
                {post.media_type === 'video' ? (
                  <video src={url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                )}
                {index === 3 && post.media_urls.length > 4 && (
                  <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-card text-2xl font-bold">+{post.media_urls.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Compact Footer */}
      <CardFooter className="flex flex-col pt-0 px-3 pb-3">
        <div className="flex items-center justify-around w-full border-t border-border/40 pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            className={`flex-1 gap-1.5 rounded-lg h-8 text-xs transition-all ${
              post.liked_by_user 
                ? 'text-destructive hover:text-destructive hover:bg-destructive/10' 
                : 'hover:text-destructive hover:bg-destructive/5'
            }`}
          >
            <Heart className={`h-4 w-4 transition-transform ${post.liked_by_user ? 'fill-current' : ''} ${isLiking ? 'scale-125' : ''}`} />
            <span className="font-medium">{post.likes_count > 0 ? post.likes_count : ''}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={`flex-1 gap-1.5 rounded-lg h-8 text-xs transition-all hover:text-sky hover:bg-sky/5 ${showComments ? 'text-sky bg-sky/10' : ''}`}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{post.comments_count > 0 ? post.comments_count : ''}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="flex-1 gap-1.5 rounded-lg h-8 text-xs transition-all hover:text-accent hover:bg-accent/5"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {showComments && (
          <div className="w-full mt-3 animate-slide-up">
            <CommentsSection postId={post.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};