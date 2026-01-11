import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
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

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like posts');
      navigate('/auth');
      return;
    }
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
      // Fallback to copy link
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80"
          onClick={() => navigate(`/pet/${post.pet_id}`)}
        >
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={post.pet?.avatar_url || ''} alt={post.pet?.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {post.pet?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{post.pet?.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        {user?.id === post.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="pb-2">
        {post.content && (
          <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
        )}
        
        {post.media_urls && post.media_urls.length > 0 && (
          <div className={`grid gap-1 rounded-xl overflow-hidden ${
            post.media_urls.length === 1 ? 'grid-cols-1' : 
            post.media_urls.length === 2 ? 'grid-cols-2' :
            post.media_urls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
          }`}>
            {post.media_urls.slice(0, 4).map((url, index) => (
              <div 
                key={index} 
                className={`relative ${
                  post.media_urls.length === 3 && index === 0 ? 'row-span-2' : ''
                }`}
              >
                {post.media_type === 'video' ? (
                  <video 
                    src={url} 
                    controls 
                    className="w-full h-full object-cover max-h-96"
                  />
                ) : (
                  <img 
                    src={url} 
                    alt="" 
                    className="w-full h-full object-cover max-h-96"
                  />
                )}
                {index === 3 && post.media_urls.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      +{post.media_urls.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col pt-2">
        <div className="flex items-center justify-between w-full border-t pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            className={post.liked_by_user ? 'text-red-500' : ''}
          >
            <Heart className={`h-5 w-5 mr-1 ${post.liked_by_user ? 'fill-current' : ''}`} />
            {post.likes_count > 0 && post.likes_count}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            {post.comments_count > 0 && post.comments_count}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-5 w-5 mr-1" />
          </Button>
        </div>

        {showComments && (
          <CommentsSection postId={post.id} />
        )}
      </CardFooter>
    </Card>
  );
};
