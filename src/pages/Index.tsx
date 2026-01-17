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
        {/* Hero Section */}
        <section className="relative gradient-hero py-12 md:py-20 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-[10%] w-24 h-24 bg-primary/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-[15%] w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-[60%] w-20 h-20 bg-lavender/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            
            {/* Paw prints decoration */}
            <div className="absolute top-20 right-[20%] text-primary/10 text-6xl transform rotate-12">🐾</div>
            <div className="absolute bottom-20 left-[10%] text-accent/10 text-5xl transform -rotate-12">🐾</div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur text-primary px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-soft animate-bounce-gentle">
                <Sparkles className="h-4 w-4" />
                The Social Network for Pet Lovers
                <Heart className="h-4 w-4 text-destructive fill-destructive" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
                Connect, Share & 
                <span className="text-gradient-fun"> Love</span>
                <br />Your Pets
              </h1>
              
              <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
                Create profiles for your furry friends, share their adventures, 
                shop for essentials, and book vet appointments — all in one paw-some place! 🐾
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                {user && pets.length === 0 ? (
                  <Link to="/pets/new">
                    <Button size="lg" className="btn-primary rounded-2xl gap-2 text-base px-8 h-14 font-bold">
                      <PawPrint className="h-5 w-5" />
                      Add Your First Pet
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link to="/auth">
                    <Button size="lg" className="btn-primary rounded-2xl gap-2 text-base px-8 h-14 font-bold">
                      Get Started Free
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : null}
                <Link to="/explore">
                  <Button variant="outline" size="lg" className="rounded-2xl gap-2 text-base px-8 h-14 font-bold border-2 hover:bg-accent/5 hover:border-accent hover:text-accent">
                    <Search className="h-5 w-5" />
                    Explore Pets
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-12 max-w-xl mx-auto">
              {[
                { icon: PawPrint, count: `${trendingPets.length}+`, label: 'Happy Pets', color: 'from-primary to-coral-dark' },
                { icon: ShoppingBag, count: '100+', label: 'Products', color: 'from-accent to-mint' },
                { icon: Stethoscope, count: '10+', label: 'Clinics', color: 'from-lavender to-sky' },
              ].map((stat, i) => (
                <div 
                  key={stat.label}
                  className="text-center p-4 sm:p-6 bg-card/80 backdrop-blur-sm rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-button group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-8">
          {/* Stories Bar */}
          <div className="bg-card rounded-2xl shadow-soft p-4 mb-6">
            <StoriesBar />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Feed - 2 columns */}
            <div className="lg:col-span-2">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-card shadow-soft rounded-2xl p-1.5 h-14">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-coral-dark data-[state=active]:text-white data-[state=active]:shadow-button font-bold transition-all"
                  >
                    <Globe className="h-4 w-4" />
                    Discover
                  </TabsTrigger>
                  <TabsTrigger 
                    value="following" 
                    className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-mint data-[state=active]:text-white data-[state=active]:shadow-button font-bold transition-all" 
                    disabled={!user}
                  >
                    <Users className="h-4 w-4" />
                    Following
                  </TabsTrigger>
                </TabsList>

                <CreatePostCard onPostCreated={refreshPosts} />

                <ScrollArea className="h-[600px] pr-4">
                  <TabsContent value="all" className="mt-0">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <p className="text-muted-foreground font-medium">Loading amazing pet content...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
                        <CardContent className="py-16 text-center">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <span className="text-4xl animate-bounce-gentle">🐾</span>
                          </div>
                          <p className="text-lg font-bold text-foreground mb-2">No posts yet!</p>
                          <p className="text-muted-foreground mb-6">Be the first to share something amazing</p>
                          {user && pets.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Use the post creator above to share your pet's first moment! ✨
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
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
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-mint/20 flex items-center justify-center mb-4">
                          <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        </div>
                        <p className="text-muted-foreground font-medium">Loading your feed...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
                        <CardContent className="py-16 text-center">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/20 to-lavender/20 flex items-center justify-center">
                            <Users className="h-10 w-10 text-accent" />
                          </div>
                          <p className="text-lg font-bold text-foreground mb-2">
                            {user ? "Your feed is empty!" : "Join the community"}
                          </p>
                          <p className="text-muted-foreground mb-6">
                            {user ? "Follow some adorable pets to see their posts here!" : "Login to see posts from pets you follow"}
                          </p>
                          <Link to="/explore">
                            <Button className="btn-accent rounded-xl font-bold">
                              <Search className="h-4 w-4 mr-2" />
                              Discover Pets
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
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
            <div className="space-y-6">
              {/* Trending Pets */}
              {trendingPets.length > 0 && (
                <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-sunshine" />
                      Featured Pets
                    </h3>
                    <div className="space-y-3">
                      {trendingPets.slice(0, 5).map((pet, index) => (
                        <Link 
                          key={pet.id} 
                          to={`/pet/${pet.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300 group"
                        >
                          <div className="p-0.5 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 group-hover:from-primary group-hover:to-accent transition-all">
                            <div className="h-11 w-11 rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-card">
                              {pet.avatar_url ? (
                                <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                              ) : (
                                <PawPrint className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{pet.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{pet.species}{pet.breed && ` • ${pet.breed}`}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                          </Button>
                        </Link>
                      ))}
                    </div>
                    <Link to="/explore" className="block mt-4">
                      <Button variant="outline" className="w-full rounded-xl font-bold border-2 hover:bg-primary/5 hover:border-primary hover:text-primary">
                        See All Pets
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link to="/shop" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-mint/5 hover:from-accent/20 hover:to-mint/10 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-mint flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                        <ShoppingBag className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Shop Products</p>
                        <p className="text-xs text-muted-foreground">Food, toys, medicine & more</p>
                      </div>
                    </Link>
                    <Link to="/clinics" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-lavender/10 to-sky/5 hover:from-lavender/20 hover:to-sky/10 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender to-sky flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Find Clinics</p>
                        <p className="text-xs text-muted-foreground">Book vet appointments</p>
                      </div>
                    </Link>
                    {user && (
                      <Link to="/pets/new" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-coral-light/5 hover:from-primary/20 hover:to-coral-light/10 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-coral-dark flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                          <PawPrint className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Add Pet Profile</p>
                          <p className="text-xs text-muted-foreground">Create a profile for your pet</p>
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