import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import FeaturedProducts from '@/components/FeaturedProducts';
import ClinicSection from '@/components/ClinicSection';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Globe, PawPrint, ShoppingBag, Stethoscope, ArrowRight, Sparkles } from 'lucide-react';
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
    // Fetch some trending/featured pets
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
        <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                The Social Network for Pet Lovers
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
                Connect, Share & Care for Your Pets
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                Create profiles for your furry friends, share their adventures, shop for essentials, and book vet appointments — all in one place!
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {user && pets.length === 0 ? (
                  <Link to="/pets/new">
                    <Button size="lg" className="gap-2">
                      <PawPrint className="h-5 w-5" />
                      Add Your First Pet
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link to="/auth">
                    <Button size="lg" className="gap-2">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : null}
                <Link to="/shop">
                  <Button variant="outline" size="lg" className="gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Browse Shop
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg mx-auto">
              <div className="text-center p-4 bg-card/50 backdrop-blur rounded-xl">
                <PawPrint className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{trendingPets.length}+</p>
                <p className="text-xs text-muted-foreground">Pets</p>
              </div>
              <div className="text-center p-4 bg-card/50 backdrop-blur rounded-xl">
                <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">100+</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="text-center p-4 bg-card/50 backdrop-blur rounded-xl">
                <Stethoscope className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">10+</p>
                <p className="text-xs text-muted-foreground">Clinics</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Feed - 2 columns */}
            <div className="lg:col-span-2">
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
                    <Card>
                      <CardContent className="py-12 text-center">
                        <PawPrint className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
                        {user && pets.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Use the post creator above to share your pet's first moment!
                          </p>
                        )}
                      </CardContent>
                    </Card>
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
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-2">
                          {user ? "Follow some pets to see their posts here!" : "Login to see posts from pets you follow"}
                        </p>
                        <Link to="/feed">
                          <Button variant="outline" size="sm" className="mt-4">
                            Discover Pets
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Pets */}
              {trendingPets.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Featured Pets
                    </h3>
                    <div className="space-y-3">
                      {trendingPets.slice(0, 5).map((pet) => (
                        <Link 
                          key={pet.id} 
                          to={`/pet/${pet.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {pet.avatar_url ? (
                              <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <PawPrint className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pet.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{pet.species}</p>
                          </div>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link to="/shop" className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Shop Products</p>
                        <p className="text-xs text-muted-foreground">Food, toys, medicine & more</p>
                      </div>
                    </Link>
                    <Link to="/clinics" className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Find Clinics</p>
                        <p className="text-xs text-muted-foreground">Book vet appointments</p>
                      </div>
                    </Link>
                    {user && (
                      <Link to="/pets/new" className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <PawPrint className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Add Pet Profile</p>
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