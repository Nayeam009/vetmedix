import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Compass, Sparkles, PawPrint } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <PawPrint className="h-4 w-4" />
            <span className="text-sm font-semibold">Pet Community</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Pet Feed
          </h1>
          <p className="text-muted-foreground text-sm">
            Share moments with fellow pet lovers
          </p>
        </div>

        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-soft h-auto">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 py-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-coral-light data-[state=active]:text-white data-[state=active]:shadow-button transition-all"
            >
              <Compass className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="flex items-center gap-2 py-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-mint data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-button transition-all" 
              disabled={!user}
            >
              <Users className="h-4 w-4" />
              Following
            </TabsTrigger>
          </TabsList>

          <CreatePostCard onPostCreated={refreshPosts} />

          <TabsContent value="all" className="mt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 bg-card rounded-full shadow-card">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <p className="text-muted-foreground mt-4 text-sm">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-lavender/20 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground text-sm">Be the first to share something amazing!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PostCard
                      post={post}
                      onLike={likePost}
                      onUnlike={unlikePost}
                      onDelete={refreshPosts}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-mint/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 bg-card rounded-full shadow-card">
                    <Loader2 className="h-8 w-8 animate-spin text-mint" />
                  </div>
                </div>
                <p className="text-muted-foreground mt-4 text-sm">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-mint/20 via-sky/20 to-accent/20 flex items-center justify-center">
                  <Users className="h-10 w-10 text-mint" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">
                  {user ? "No posts from followed pets" : "Login required"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {user ? "Follow some pets to see their posts here!" : "Login to see posts from pets you follow"}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PostCard
                      post={post}
                      onLike={likePost}
                      onUnlike={unlikePost}
                      onDelete={refreshPosts}
                    />
                  </div>
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