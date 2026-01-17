import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { StoriesBar } from '@/components/social/StoriesBar';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import FeaturedProducts from '@/components/FeaturedProducts';
import ClinicSection from '@/components/ClinicSection';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Globe, PawPrint, ShoppingBag, Stethoscope, ArrowRight, Sparkles, Heart, Search } from 'lucide-react';
import type { Pet } from '@/types/social';

const Index = () => {
  const { user } = useAuth();
  const { pets } = usePets();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const [trendingPets, setTrendingPets] = useState<Pet[]>([]);
  
  const { 
    posts, 
    loading, 
    likePost, 
    unlikePost, 
    refreshPosts 
  } = usePosts(undefined, feedType);

  useEffect(() => {
    const fetchTrendingPets = async () => {
      try {
        const { data } = await supabase
          .from('pets')
          .select('*')
          .limit(6)
          .order('created_at', { ascending: false });
        
        setTrendingPets((data || []) as Pet[]);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching trending pets:', error);
        }
      }
    };
    fetchTrendingPets();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main>
        {/* Compact Hero Section */}
        <section className="relative gradient-hero py-6 md:py-10 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-5 left-[10%] w-16 h-16 bg-primary/15 rounded-full blur-2xl" />
            <div className="absolute bottom-5 right-[15%] w-20 h-20 bg-accent/15 rounded-full blur-2xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-3 shadow-soft">
                  <Sparkles className="h-3 w-3" />
                  Pet Social Network
                  <Heart className="h-3 w-3 text-destructive fill-destructive" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2 leading-tight">
                  Connect & Share with
                  <span className="text-gradient-fun"> Pet Lovers</span>
                </h1>
                
                <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                  Share adventures, shop essentials, and book vet appointments 🐾
                </p>
              </div>

              <div className="flex items-center gap-3">
                {user && pets.length === 0 ? (
                  <Link to="/pets/new">
                    <Button size="sm" className="btn-primary rounded-xl gap-2 font-bold">
                      <PawPrint className="h-4 w-4" />
                      Add Pet
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link to="/auth">
                    <Button size="sm" className="btn-primary rounded-xl gap-2 font-bold">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : null}
                <Link to="/explore">
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold border-2 hover:bg-accent/5 hover:border-accent hover:text-accent">
                    <Search className="h-4 w-4" />
                    Explore
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-5">
          {/* Stories Bar */}
          <div className="bg-card rounded-xl shadow-soft p-3 mb-4">
            <StoriesBar />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Main Feed - 2 columns */}
            <div className="lg:col-span-2">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-card shadow-soft rounded-xl p-1 h-10">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-1.5 rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-coral-dark data-[state=active]:text-white data-[state=active]:shadow-button font-semibold transition-all"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Discover
                  </TabsTrigger>
                  <TabsTrigger 
                    value="following" 
                    className="flex items-center gap-1.5 rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-mint data-[state=active]:text-white data-[state=active]:shadow-button font-semibold transition-all" 
                    disabled={!user}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Following
                  </TabsTrigger>
                </TabsList>

                <CreatePostCard onPostCreated={refreshPosts} />

                <ScrollArea className="h-[550px] pr-2">
                  <TabsContent value="all" className="mt-0">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                        <p className="text-muted-foreground text-sm">Loading posts...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <Card className="border-0 shadow-soft rounded-xl overflow-hidden">
                        <CardContent className="py-10 text-center">
                          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <span className="text-2xl">🐾</span>
                          </div>
                          <p className="font-semibold text-foreground mb-1">No posts yet!</p>
                          <p className="text-muted-foreground text-sm">Be the first to share</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {posts.map((post, index) => (
                          <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
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
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-mint/20 flex items-center justify-center mb-3">
                          <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        </div>
                        <p className="text-muted-foreground text-sm">Loading your feed...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <Card className="border-0 shadow-soft rounded-xl overflow-hidden">
                        <CardContent className="py-10 text-center">
                          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-lavender/20 flex items-center justify-center">
                            <Users className="h-7 w-7 text-accent" />
                          </div>
                          <p className="font-semibold text-foreground mb-1">
                            {user ? "Your feed is empty!" : "Join the community"}
                          </p>
                          <p className="text-muted-foreground text-sm mb-4">
                            {user ? "Follow pets to see their posts" : "Login to see posts from pets you follow"}
                          </p>
                          <Link to="/explore">
                            <Button size="sm" className="btn-accent rounded-lg font-semibold">
                              <Search className="h-3.5 w-3.5 mr-1.5" />
                              Discover
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {posts.map((post, index) => (
                          <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
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
                </ScrollArea>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Trending Pets */}
              {trendingPets.length > 0 && (
                <Card className="border-0 shadow-soft rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-sunshine" />
                      Featured Pets
                    </h3>
                    <div className="space-y-1">
                      {trendingPets.slice(0, 5).map((pet) => (
                        <Link 
                          key={pet.id} 
                          to={`/pet/${pet.id}`}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-all group"
                        >
                          <div className="p-0.5 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 group-hover:from-primary group-hover:to-accent transition-all">
                            <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center overflow-hidden border border-card">
                              {pet.avatar_url ? (
                                <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                              ) : (
                                <PawPrint className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate group-hover:text-primary transition-colors">{pet.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{pet.species}{pet.breed && ` • ${pet.breed}`}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link to="/explore" className="block mt-3">
                      <Button variant="outline" size="sm" className="w-full rounded-lg text-xs font-semibold border hover:bg-primary/5 hover:border-primary hover:text-primary h-8">
                        See All Pets
                        <ArrowRight className="h-3 w-3 ml-1.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card className="border-0 shadow-soft rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link to="/shop" className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-accent/10 to-transparent hover:from-accent/15 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-mint flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <ShoppingBag className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-xs">Shop Products</p>
                        <p className="text-[10px] text-muted-foreground">Food, toys, medicine & more</p>
                      </div>
                    </Link>
                    <Link to="/clinics" className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-lavender/10 to-transparent hover:from-lavender/15 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-lavender to-sky flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Stethoscope className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-xs">Find Clinics</p>
                        <p className="text-[10px] text-muted-foreground">Book vet appointments</p>
                      </div>
                    </Link>
                    {user && (
                      <Link to="/pets/new" className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-transparent hover:from-primary/15 transition-all group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-coral-dark flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <PawPrint className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-xs">Add Pet Profile</p>
                          <p className="text-[10px] text-muted-foreground">Create a profile for your pet</p>
                        </div>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        <FeaturedProducts />
        
        {/* Clinic Section */}
        <ClinicSection />
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Index;