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
    <div className="min-h-screen bg-muted/40 pb-20 md:pb-0">
      <Navbar />
      
      <main>
        {/* Hero Section - Clean gradient background */}
        <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/50 to-white">
          {/* Subtle decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl" />
            <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-amber-200/25 rounded-full blur-2xl" />
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-orange-100 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>The Social Network for Pet Lovers</span>
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              </div>
              
              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-[1.15]">
                Connect, Share &
                <span className="text-primary"> Love</span>
                <br className="hidden sm:block" />
                <span className="text-foreground"> Your Pets</span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed px-4">
                Create profiles for your furry friends, share their adventures, 
                shop for essentials, and book vet appointments — all in one place! 🐾
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                {user && pets.length === 0 ? (
                  <Link to="/pets/new" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 text-base px-6 sm:px-8 h-12 sm:h-14 font-semibold shadow-md">
                      <PawPrint className="h-5 w-5" />
                      Add Your First Pet
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 text-base px-6 sm:px-8 h-12 sm:h-14 font-semibold shadow-md">
                      Get Started Free
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : null}
                <Link to="/explore" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl gap-2 text-base px-6 sm:px-8 h-12 sm:h-14 font-semibold border-2 border-border hover:bg-muted/50">
                    <Search className="h-5 w-5" />
                    Explore Pets
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-12 md:mt-16 max-w-lg mx-auto">
              {[
                { icon: PawPrint, count: `${trendingPets.length}+`, label: 'Happy Pets', bgColor: 'bg-orange-500' },
                { icon: ShoppingBag, count: '100+', label: 'Products', bgColor: 'bg-teal-500' },
                { icon: Stethoscope, count: '10+', label: 'Clinics', bgColor: 'bg-violet-500' },
              ].map((stat) => (
                <div 
                  key={stat.label}
                  className="text-center p-3 sm:p-4 md:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">
          {/* Stories Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-3 sm:p-4 mb-4 sm:mb-6">
            <StoriesBar />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Feed - 2 columns */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-white shadow-sm border border-border/50 rounded-xl p-1 h-12">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Discover
                  </TabsTrigger>
                  <TabsTrigger 
                    value="following" 
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-semibold transition-all text-sm" 
                    disabled={!user}
                  >
                    <Users className="h-4 w-4" />
                    Following
                  </TabsTrigger>
                </TabsList>

                <CreatePostCard onPostCreated={refreshPosts} />

                <ScrollArea className="h-[500px] sm:h-[600px]">
                  <TabsContent value="all" className="mt-0 pr-2 sm:pr-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground text-sm">Loading posts...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl">🐾</span>
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-foreground mb-2">No posts yet!</p>
                        <p className="text-muted-foreground text-sm mb-4">Be the first to share something amazing</p>
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

                  <TabsContent value="following" className="mt-0 pr-2 sm:pr-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground text-sm">Loading your feed...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-foreground mb-2">
                          {user ? "Your feed is empty!" : "Join the community"}
                        </p>
                        <p className="text-muted-foreground text-sm mb-4">
                          {user ? "Follow some pets to see their posts here!" : "Login to see posts from pets you follow"}
                        </p>
                        <Link to="/explore">
                          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold">
                            <Search className="h-4 w-4 mr-2" />
                            Discover Pets
                          </Button>
                        </Link>
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
                </ScrollArea>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              {/* Trending Pets */}
              {trendingPets.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Featured Pets
                    </h3>
                    <div className="space-y-1">
                      {trendingPets.slice(0, 5).map((pet) => (
                        <Link 
                          key={pet.id} 
                          to={`/pet/${pet.id}`}
                          className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border flex-shrink-0">
                            {pet.avatar_url ? (
                              <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <PawPrint className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{pet.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{pet.species}{pet.breed && ` • ${pet.breed}`}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link to="/explore" className="block mt-3 sm:mt-4">
                      <Button variant="outline" className="w-full rounded-lg font-semibold text-sm h-10">
                        See All Pets
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Quick Actions</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <Link to="/shop" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-teal-50 hover:bg-teal-100/80 transition-colors">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">Shop Products</p>
                        <p className="text-xs text-muted-foreground truncate">Food, toys, medicine & more</p>
                      </div>
                    </Link>
                    <Link to="/clinics" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-violet-50 hover:bg-violet-100/80 transition-colors">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">Find Clinics</p>
                        <p className="text-xs text-muted-foreground truncate">Book vet appointments</p>
                      </div>
                    </Link>
                    {user && (
                      <Link to="/pets/new" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-orange-50 hover:bg-orange-100/80 transition-colors">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                          <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">Add New Pet</p>
                          <p className="text-xs text-muted-foreground truncate">Create a profile for your pet</p>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        <section className="bg-white border-y border-border/50">
          <FeaturedProducts />
        </section>

        {/* Clinic Section */}
        <section className="bg-muted/30">
          <ClinicSection />
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Index;