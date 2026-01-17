import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PetProfileCard } from '@/components/social/PetProfileCard';
import { PostCard } from '@/components/social/PostCard';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Grid3X3, ImageIcon, Film, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { Pet, Post } from '@/types/social';

const PetProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  
  const { 
    posts, 
    loading: postsLoading, 
    likePost, 
    unlikePost, 
    refreshPosts 
  } = usePosts(id, 'pet');

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setPet(data as Pet);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching pet:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  const handlePetUpdate = (updatedPet: Pet) => {
    setPet(updatedPet);
  };

  // Filter posts by media type
  const imagePosts = posts.filter(post => post.media_type === 'image' && post.media_urls?.length > 0);
  const videoPosts = posts.filter(post => post.media_type === 'video' && post.media_urls?.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-2xl font-bold mb-2">Pet Not Found</h1>
          <p className="text-muted-foreground mb-4">This pet profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/feed')}>
            Go to Feed
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === pet.user_id;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
        {/* Profile Card */}
        <PetProfileCard 
          pet={pet} 
          postsCount={posts.length} 
          isOwner={isOwner}
          onPetUpdate={handlePetUpdate}
        />

        {/* Create Post (only for owner) */}
        {isOwner && (
          <div className="mt-4 sm:mt-6">
            <CreatePostCard onPostCreated={refreshPosts} />
          </div>
        )}

        {/* Content Tabs */}
        <div className="mt-4 sm:mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-11 sm:h-12 bg-card rounded-xl shadow-sm border border-border/50 p-1">
              <TabsTrigger 
                value="posts" 
                className="flex-1 h-full gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm font-medium"
              >
                <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Posts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="photos" 
                className="flex-1 h-full gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm font-medium"
              >
                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Photos</span>
                {imagePosts.length > 0 && (
                  <span className="text-[10px] sm:text-xs bg-muted px-1.5 rounded-full">
                    {imagePosts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="videos" 
                className="flex-1 h-full gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm font-medium"
              >
                <Film className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Videos</span>
                {videoPosts.length > 0 && (
                  <span className="text-[10px] sm:text-xs bg-muted px-1.5 rounded-full">
                    {videoPosts.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-4">
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-muted-foreground font-medium">No posts yet</p>
                  {isOwner && (
                    <p className="text-sm text-muted-foreground mt-1">Share your first moment!</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
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

            {/* Photos Tab */}
            <TabsContent value="photos" className="mt-4">
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : imagePosts.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-muted-foreground font-medium">No photos yet</p>
                  {isOwner && (
                    <p className="text-sm text-muted-foreground mt-1">Share some cute photos!</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {imagePosts.map((post) => (
                    post.media_urls?.map((url, index) => (
                      <div 
                        key={`${post.id}-${index}`} 
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <img 
                          src={url} 
                          alt="" 
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="mt-4">
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : videoPosts.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="text-muted-foreground font-medium">No videos yet</p>
                  {isOwner && (
                    <p className="text-sm text-muted-foreground mt-1">Share fun videos (max 1 min)!</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {videoPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-muted"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <video 
                        src={post.media_urls?.[0]} 
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-foreground border-b-[6px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PetProfilePage;
