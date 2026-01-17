import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { useComments } from '@/hooks/useComments';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CommentsSectionProps {
  postId: string;
}

export const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const { comments, loading, addComment, deleteComment } = useComments(postId);
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      navigate('/auth');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const result = await addComment(newComment.trim(), activePet?.id);
    if (result?.success === false && result?.error) {
      toast.error(result.error);
    }
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-8 w-8 ring-1 ring-border flex-shrink-0">
          <AvatarImage src={activePet?.avatar_url || ''} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {activePet?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={user ? "Write a comment..." : "Login to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || submitting}
            maxLength={500}
            className="w-full h-9 bg-muted rounded-full px-4 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {newComment.trim() && (
            <Button 
              type="submit" 
              size="icon"
              variant="ghost"
              disabled={!user || submitting}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-primary hover:bg-primary/10"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-2">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Avatar 
                className="h-8 w-8 ring-1 ring-border cursor-pointer flex-shrink-0"
                onClick={() => comment.pet_id && navigate(`/pet/${comment.pet_id}`)}
              >
                <AvatarImage src={comment.pet?.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="bg-muted text-xs font-semibold">
                  {comment.pet?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="inline-block bg-muted rounded-2xl px-3 py-2 max-w-full">
                  <span 
                    className="text-[13px] font-semibold text-foreground hover:underline cursor-pointer block"
                    onClick={() => comment.pet_id && navigate(`/pet/${comment.pet_id}`)}
                  >
                    {comment.pet?.name || 'Anonymous'}
                  </span>
                  <p className="text-[15px] text-foreground break-words">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  <button className="text-xs font-semibold text-muted-foreground hover:underline">
                    Like
                  </button>
                  <button className="text-xs font-semibold text-muted-foreground hover:underline">
                    Reply
                  </button>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-xs font-semibold text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};