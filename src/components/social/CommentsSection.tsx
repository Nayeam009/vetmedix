import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    await addComment(newComment.trim(), activePet?.id);
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <div className="w-full mt-3 border-t pt-3 space-y-3">
      {/* Comments list */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-2">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Avatar 
                className="h-8 w-8 cursor-pointer"
                onClick={() => comment.pet_id && navigate(`/pet/${comment.pet_id}`)}
              >
                <AvatarImage src={comment.pet?.avatar_url || ''} />
                <AvatarFallback className="bg-secondary text-xs">
                  {comment.pet?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {comment.pet?.name || 'Anonymous'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {user?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={activePet?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-xs">
            {activePet?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder={user ? "Write a comment..." : "Login to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || submitting}
            maxLength={500}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!user || !newComment.trim() || submitting}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
