import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Heart,
  Users,
  Image,
  Trash2,
  Eye,
  Search,
  Loader2,
  Filter,
  Calendar,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Post {
  id: string;
  content: string | null;
  media_urls: string[] | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  pet_id: string;
  pet?: {
    id: string;
    name: string;
    avatar_url: string | null;
    species: string;
  };
}

const AdminSocial = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Fetch social stats
  const { data: socialStats } = useQuery({
    queryKey: ['admin-social-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        { count: totalPosts },
        { count: totalPets },
        { count: totalLikes },
        { count: totalComments },
        { count: postsToday },
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('pets').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today),
      ]);

      return {
        totalPosts: totalPosts || 0,
        totalPets: totalPets || 0,
        totalLikes: totalLikes || 0,
        totalComments: totalComments || 0,
        postsToday: postsToday || 0,
      };
    },
    enabled: isAdmin,
  });

  // Fetch all posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          pet:pets(id, name, avatar_url, species)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Post[];
    },
    enabled: isAdmin,
  });

  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      // Delete related data first
      await supabase.from('comments').delete().eq('post_id', postId);
      await supabase.from('likes').delete().eq('post_id', postId);
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
      toast.success('Post deleted successfully');
      setDeleteConfirmOpen(false);
      setPostToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });

  // Redirect if not admin
  if (!authLoading && !roleLoading && !isAdmin) {
    navigate('/');
    return null;
  }

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter posts
  const filteredPosts = posts?.filter((post) => {
    const matchesSearch =
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.pet?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'with_media') return matchesSearch && post.media_urls && post.media_urls.length > 0;
    if (filterType === 'text_only') return matchesSearch && (!post.media_urls || post.media_urls.length === 0);
    return matchesSearch;
  });

  return (
    <AdminLayout title="Social Media Moderation" subtitle="Monitor and moderate pet social media content">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{socialStats?.totalPosts || 0}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{socialStats?.postsToday || 0}</p>
                <p className="text-sm text-muted-foreground">Posts Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{socialStats?.totalPets || 0}</p>
                <p className="text-sm text-muted-foreground">Pet Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{socialStats?.totalLikes || 0}</p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{socialStats?.totalComments || 0}</p>
                <p className="text-sm text-muted-foreground">Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="with_media">With Media</SelectItem>
            <SelectItem value="text_only">Text Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      {postsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPosts && filteredPosts.length > 0 ? (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.pet?.avatar_url || ''} />
                      <AvatarFallback>{post.pet?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{post.pet?.name || 'Unknown Pet'}</span>
                        <Badge variant="outline" className="text-xs">
                          {post.pet?.species || 'Pet'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          · {format(new Date(post.created_at), 'PPp')}
                        </span>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">
                        {post.content || <span className="text-muted-foreground italic">No text content</span>}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.comments_count || 0}
                        </span>
                        {post.media_urls && post.media_urls.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Image className="h-4 w-4" />
                            {post.media_urls.length} media
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-13 md:ml-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPost(post);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPostToDelete(post.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'No posts have been created yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Post Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              Posted by {selectedPost?.pet?.name} on {selectedPost && format(new Date(selectedPost.created_at), 'PPp')}
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedPost.pet?.avatar_url || ''} />
                  <AvatarFallback>{selectedPost.pet?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedPost.pet?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPost.pet?.species}</p>
                </div>
              </div>
              
              {selectedPost.content && (
                <p className="text-foreground">{selectedPost.content}</p>
              )}

              {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.media_urls.map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      alt={`Media ${i + 1}`} 
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {selectedPost.likes_count || 0} likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {selectedPost.comments_count || 0} comments
                </span>
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPostToDelete(selectedPost.id);
                    setViewOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              All likes and comments associated with this post will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && deletePost.mutate(postToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSocial;
