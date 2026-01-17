import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Globe, ThumbsUp } from 'lucide-react';
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
    <article className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 sm:p-4 pb-2 sm:pb-3">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0"
          onClick={() => navigate(`/pet/${post.pet_id}`)}
        >
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-1 ring-border flex-shrink-0">
            <AvatarImage src={post.pet?.avatar_url || ''} alt={post.pet?.name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {post.pet?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-[15px] text-foreground hover:underline leading-tight truncate">
              {post.pet?.name}
            </h3>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
              <span className="truncate">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              <span>·</span>
              <Globe className="h-3 w-3 flex-shrink-0" />
            </div>
          </div>
        </div>
        
        {user?.id === post.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted flex-shrink-0">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 shadow-lg rounded-lg">
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-3 sm:px-4 pb-2 sm:pb-3">
          <p className="text-sm sm:text-[15px] text-foreground leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
        </div>
      )}
      
      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid ${
          post.media_urls.length === 1 ? 'grid-cols-1' : 
          post.media_urls.length === 2 ? 'grid-cols-2' :
          post.media_urls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
        } gap-[1px] sm:gap-0.5 bg-border/50`}>
          {post.media_urls.slice(0, 4).map((url, index) => (
            <div 
              key={index} 
              className={`relative overflow-hidden bg-muted ${
                post.media_urls.length === 3 && index === 0 ? 'row-span-2' : ''
              } ${post.media_urls.length === 1 ? 'aspect-[16/10]' : 'aspect-square'}`}
            >
              {post.media_type === 'video' ? (
                <video 
                  src={url} 
                  controls 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all"
                />
              )}
              {index === 3 && post.media_urls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer">
                  <span className="text-white text-xl sm:text-2xl font-semibold">
                    +{post.media_urls.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground">
          {post.likes_count > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center h-[16px] w-[16px] sm:h-[18px] sm:w-[18px] rounded-full bg-primary">
                <ThumbsUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white fill-white" />
              </div>
              <span>{post.likes_count}</span>
            </div>
          ) : <div />}
          {post.comments_count > 0 && (
            <button 
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-border/50 mx-3 sm:mx-4">
        <div className="flex items-center py-1">
          <Button 
            variant="ghost" 
            onClick={handleLike}
            className={`flex-1 h-9 sm:h-10 gap-1.5 sm:gap-2 rounded-md font-semibold text-xs sm:text-sm ${
              post.liked_by_user 
                ? 'text-primary hover:text-primary hover:bg-primary/5' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <ThumbsUp className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${
              post.liked_by_user ? 'fill-primary' : ''
            } ${isLiking ? 'scale-125' : ''}`} />
            <span className="hidden xs:inline">Like</span>
          </Button>
          
          <Button 
            variant="ghost"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 h-9 sm:h-10 gap-1.5 sm:gap-2 rounded-md font-semibold text-xs sm:text-sm text-muted-foreground hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Comment</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleShare}
            className="flex-1 h-9 sm:h-10 gap-1.5 sm:gap-2 rounded-md font-semibold text-xs sm:text-sm text-muted-foreground hover:bg-muted"
          >
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border/50 bg-muted/30 p-3 sm:p-4">
          <CommentsSection postId={post.id} />
        </div>
      )}
    </article>
  );
};