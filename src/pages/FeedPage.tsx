import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Compass } from 'lucide-react';

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
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-[680px]">
        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
          <TabsList className="grid w-full grid-cols-2 mb-4 p-1 bg-white border border-border/50 rounded-xl shadow-sm h-11 sm:h-12">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 rounded-lg font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none transition-all"
            >
              <Compass className="h-4 w-4" />
              <span className="hidden xs:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="flex items-center gap-2 rounded-lg font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none transition-all" 
              disabled={!user}
            >
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline">Following</span>
            </TabsTrigger>
          </TabsList>

          <CreatePostCard onPostCreated={refreshPosts} />

          <TabsContent value="all" className="mt-0 space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 sm:p-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">📝</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">No posts yet</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">Be the first to share something!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onUnlike={unlikePost}
                  onDelete={refreshPosts}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0 space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 sm:p-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                  {user ? "No posts from followed pets" : "Login required"}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {user ? "Follow some pets to see their posts here!" : "Login to see posts from pets you follow"}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onUnlike={unlikePost}
                  onDelete={refreshPosts}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default FeedPage;