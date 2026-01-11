import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Globe } from 'lucide-react';

const FeedPage = () => {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  
  const { 
    posts, 
    loading, 
    likePost, 
    unlikePost, 
    refreshPosts 
  } = usePosts(undefined, feedType);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2" disabled={!user}>
              <Users className="h-4 w-4" />
              Following
            </TabsTrigger>
          </TabsList>

          <CreatePostCard onPostCreated={refreshPosts} />

          <TabsContent value="all" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={likePost}
                    onUnlike={unlikePost}
                    onDelete={refreshPosts}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {user ? "Follow some pets to see their posts here!" : "Login to see posts from pets you follow"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={likePost}
                    onUnlike={unlikePost}
                    onDelete={refreshPosts}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default FeedPage;
