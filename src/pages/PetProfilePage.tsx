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
      
      <main className="container mx-auto px-0 sm:px-4 py-0 sm:py-6 max-w-3xl">
        {/* Profile Card */}
        <PetProfileCard 
          pet={pet} 
          postsCount={posts.length} 
          isOwner={isOwner}
          onPetUpdate={handlePetUpdate}
        />

        {/* Create Post (only for owner) */}
        {isOwner && (
          <div className="mt-3 sm:mt-4 px-2 sm:px-0">
            <CreatePostCard onPostCreated={refreshPosts} />
          </div>
        )}

        {/* Content Tabs - Facebook Style */}
        <div className="mt-3 sm:mt-4 px-2 sm:px-0">
          <div className="bg-card rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full h-12 sm:h-14 bg-transparent rounded-none border-b border-border/50 p-0 grid grid-cols-3">
                <TabsTrigger 
                  value="posts" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-semibold text-sm sm:text-base transition-all"
                >
                  <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="photos" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-semibold text-sm sm:text-base transition-all"
                >
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Photos
                </TabsTrigger>
                <TabsTrigger 
                  value="videos" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary font-semibold text-sm sm:text-base transition-all"
                >
                  <Film className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Videos
                </TabsTrigger>
              </TabsList>

              {/* Posts Tab */}
              <TabsContent value="posts" className="mt-0 p-3 sm:p-4">
                {postsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                      <Grid3X3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No posts yet</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Share your first moment!" : "When this pet shares, posts will appear here."}
                    </p>
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
              <TabsContent value="photos" className="mt-0 p-3 sm:p-4">
                {postsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : imagePosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No photos</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Share cute photos of this pet!" : "No photos shared yet."}
                    </p>
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
              <TabsContent value="videos" className="mt-0 p-3 sm:p-4">
                {postsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : videoPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No videos</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner ? "Share fun videos (max 1 min)!" : "No videos shared yet."}
                    </p>
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
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-foreground border-b-[8px] border-b-transparent ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PetProfilePage;
