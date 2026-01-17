import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Verified, Bookmark } from 'lucide-react';
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
    <Card className="overflow-hidden border border-border/40 shadow-card hover:shadow-hover transition-all duration-300 bg-card/95 backdrop-blur-sm rounded-2xl group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3">
        <div 
          className="flex items-center gap-3 cursor-pointer group/avatar"
          onClick={() => navigate(`/pet/${post.pet_id}`)}
        >
          <div className="relative">
            <div className="p-[2px] rounded-full bg-gradient-to-br from-primary via-coral-light to-accent shadow-sm">
              <Avatar className="h-12 w-12 border-[2.5px] border-card">
                <AvatarImage src={post.pet?.avatar_url || ''} alt={post.pet?.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-lg">
                  {post.pet?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-mint rounded-full border-2 border-card" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-[15px] group-hover/avatar:text-primary transition-colors">
                {post.pet?.name}
              </p>
              <Verified className="h-4 w-4 text-sky fill-sky-light" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {user?.id === post.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border shadow-lg rounded-xl min-w-[140px]">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-0">
        {post.content && (
          <p className="text-[15px] leading-relaxed mb-4 text-foreground/90 whitespace-pre-wrap">{post.content}</p>
        )}
        
        {post.media_urls && post.media_urls.length > 0 && (
          <div className={`grid gap-1 rounded-2xl overflow-hidden ${
            post.media_urls.length === 1 ? 'grid-cols-1' : 
            post.media_urls.length === 2 ? 'grid-cols-2' :
            post.media_urls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
          }`}>
            {post.media_urls.slice(0, 4).map((url, index) => (
              <div 
                key={index} 
                className={`relative overflow-hidden ${
                  post.media_urls.length === 3 && index === 0 ? 'row-span-2' : ''
                } ${post.media_urls.length === 1 ? 'aspect-[4/3]' : 'aspect-square'}`}
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
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                  />
                )}
                {index === 3 && post.media_urls.length > 4 && (
                  <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-card text-3xl font-bold">
                      +{post.media_urls.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Engagement Stats */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="px-4 pb-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {post.likes_count > 0 && (
              <span className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
                    <Heart className="h-3 w-3 text-white fill-white" />
                  </div>
                </div>
                <span className="font-medium">{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
              </span>
            )}
          </div>
          {post.comments_count > 0 && (
            <button 
              onClick={() => setShowComments(!showComments)}
              className="hover:underline font-medium"
            >
              {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      <CardFooter className="flex flex-col p-0">
        <div className="flex items-center w-full border-t border-border/40 px-2 py-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            className={`flex-1 gap-2 h-11 rounded-xl font-semibold transition-all duration-200 ${
              post.liked_by_user 
                ? 'text-red-500 hover:text-red-500 hover:bg-red-500/10' 
                : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/5'
            }`}
          >
            <Heart className={`h-5 w-5 transition-all ${
              post.liked_by_user ? 'fill-current scale-110' : ''
            } ${isLiking ? 'scale-125 animate-bounce-gentle' : ''}`} />
            <span className="text-sm">Like</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={`flex-1 gap-2 h-11 rounded-xl font-semibold transition-all duration-200 text-muted-foreground hover:text-sky hover:bg-sky/5 ${
              showComments ? 'text-sky bg-sky/10' : ''
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">Comment</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="flex-1 gap-2 h-11 rounded-xl font-semibold transition-all duration-200 text-muted-foreground hover:text-mint hover:bg-mint/5"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-sm">Share</span>
          </Button>
        </div>

        {showComments && (
          <div className="w-full p-4 pt-2 border-t border-border/40 animate-fade-in bg-muted/30">
            <CommentsSection postId={post.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};