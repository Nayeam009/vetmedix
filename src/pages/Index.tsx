import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { StoriesBar } from '@/components/social/StoriesBar';
import { CreatePostCard } from '@/components/social/CreatePostCard';
import { PostCard } from '@/components/social/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Users, Globe, PawPrint, 
  ArrowRight, Sparkles, Heart, Search, Camera, MessageCircle, 
  Star, TrendingUp, Zap, Share2, Bell
} from 'lucide-react';
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
        {/* Hero Section - Playful & Social Media Focused */}
        <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 gradient-hero" />
          
          {/* Floating Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large blobs */}
            <div className="absolute -top-20 -right-20 w-64 sm:w-80 h-64 sm:h-80 bg-coral-light/40 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute top-1/2 -left-20 w-48 sm:w-64 h-48 sm:h-64 bg-mint-light/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-20 right-1/4 w-56 sm:w-72 h-56 sm:h-72 bg-lavender-light/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/4 right-1/3 w-32 sm:w-40 h-32 sm:h-40 bg-sky-light/50 rounded-full blur-2xl animate-float" />
            
            {/* Floating icons */}
            <div className="absolute top-20 left-[10%] animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="p-2 sm:p-3 bg-white/80 rounded-xl shadow-lg rotate-12">
                <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-destructive fill-destructive" />
              </div>
            </div>
            <div className="absolute top-32 right-[15%] animate-float" style={{ animationDelay: '1s' }}>
              <div className="p-2 sm:p-3 bg-white/80 rounded-xl shadow-lg -rotate-6">
                <PawPrint className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
            <div className="absolute bottom-32 left-[15%] animate-float hidden sm:block" style={{ animationDelay: '1.5s' }}>
              <div className="p-2 sm:p-3 bg-white/80 rounded-xl shadow-lg rotate-6">
                <Camera className="h-4 w-4 sm:h-6 sm:w-6 text-accent" />
              </div>
            </div>
            <div className="absolute bottom-20 right-[10%] animate-float hidden md:block" style={{ animationDelay: '2s' }}>
              <div className="p-2 sm:p-3 bg-white/80 rounded-xl shadow-lg -rotate-12">
                <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-lavender" />
              </div>
            </div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Animated Badge */}
              <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm border-2 border-primary/20 text-primary px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6 shadow-lg animate-bounce-gentle">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-pulse" />
                <span>🐾 Social Network for Pets</span>
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-sunshine" />
              </div>
              
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold mb-4 sm:mb-6 leading-[1.1] px-2">
                <span className="text-foreground">Your Pets</span>
                <br />
                <span className="text-gradient-fun">Deserve Fame</span>
                <span className="inline-block ml-2 animate-wiggle">🌟</span>
              </h1>
              
              {/* Tagline */}
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-3 sm:mb-4">
                Vetmedix — Your One Stop Pet Care
              </p>
              
              {/* Subheadline */}
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
                Create adorable profiles, share pawsome moments, connect with pet lovers, 
                shop premium supplies, and book vet visits — all in one fun place! 🎉
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 mb-8 sm:mb-12">
                {user && pets.length === 0 ? (
                  <Link to="/pets/new" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto btn-primary rounded-2xl gap-2 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 font-bold">
                      <PawPrint className="h-4 w-4 sm:h-5 sm:w-5" />
                      Add Your First Pet
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto btn-primary rounded-2xl gap-2 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 font-bold">
                      Start Free Today
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                ) : null}
                <Link to="/explore" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl gap-2 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 font-bold border-2 border-primary/30 hover:bg-primary/5 hover:border-primary transition-all">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    Explore Pets
                  </Button>
                </Link>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-2">
                {[
                  { icon: Camera, label: 'Share Photos', color: 'bg-primary/10 text-primary' },
                  { icon: Heart, label: 'Get Likes', color: 'bg-destructive/10 text-destructive' },
                  { icon: MessageCircle, label: 'Chat', color: 'bg-accent/10 text-accent' },
                  { icon: Bell, label: 'Updates', color: 'bg-lavender/10 text-lavender' },
                ].map((feature) => (
                  <div 
                    key={feature.label}
                    className={`inline-flex items-center gap-1.5 sm:gap-2 ${feature.color} px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold`}
                  >
                    <feature.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Cards - Playful Design */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto">
              {[
                { icon: PawPrint, count: `${trendingPets.length || 50}+`, label: 'Happy Pets', gradient: 'gradient-primary', iconBg: 'bg-white/20' },
                { icon: Heart, count: '1K+', label: 'Daily Likes', gradient: 'bg-gradient-to-br from-destructive to-primary', iconBg: 'bg-white/20' },
                { icon: Users, count: '500+', label: 'Pet Parents', gradient: 'gradient-accent', iconBg: 'bg-white/20' },
                { icon: Camera, count: '2K+', label: 'Photos Shared', gradient: 'gradient-fun', iconBg: 'bg-white/20' },
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className={`relative text-center p-4 sm:p-5 md:p-6 ${stat.gradient} rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stat.count}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-white/80 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Features Highlight */}
        <section className="py-8 sm:py-12 bg-white border-y border-border/50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                Everything Your Pet Needs 
                <span className="text-gradient ml-1">🐕</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">Social media + Pet care in one pawfect app</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: Camera, title: 'Pet Profiles', desc: 'Create cute profiles', color: 'bg-primary/10', iconColor: 'text-primary' },
                { icon: Share2, title: 'Share Stories', desc: '24hr pet moments', color: 'bg-accent/10', iconColor: 'text-accent' },
                { icon: TrendingUp, title: 'Go Viral', desc: 'Get featured', color: 'bg-lavender/10', iconColor: 'text-lavender' },
                { icon: Star, title: 'Pet Stars', desc: 'Follow favorites', color: 'bg-sunshine/10', iconColor: 'text-sunshine' },
              ].map((feature) => (
                <div 
                  key={feature.title}
                  className={`${feature.color} rounded-2xl p-4 sm:p-5 text-center hover:scale-[1.02] transition-transform cursor-pointer active:scale-[0.98]`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
                    <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-0.5 sm:mb-1">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">
          {/* Stories Bar */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 p-3 sm:p-4 mb-4 sm:mb-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg gradient-story">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-sm sm:text-base">Pet Stories</h3>
            </div>
            <StoriesBar />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Feed - 2 columns */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'all' | 'following')}>
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-white shadow-sm border border-border/50 rounded-2xl p-1.5 h-12 sm:h-14">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-2 rounded-xl data-[state=active]:gradient-primary data-[state=active]:text-white font-bold transition-all text-xs sm:text-sm h-full"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Discover</span>
                    <span className="hidden sm:inline">🔥</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="following" 
                    className="flex items-center gap-2 rounded-xl data-[state=active]:gradient-accent data-[state=active]:text-white font-bold transition-all text-xs sm:text-sm h-full" 
                    disabled={!user}
                  >
                    <Users className="h-4 w-4" />
                    <span>Following</span>
                    <span className="hidden sm:inline">💕</span>
                  </TabsTrigger>
                </TabsList>

                <CreatePostCard onPostCreated={refreshPosts} />

                <ScrollArea className="h-[500px] sm:h-[600px]">
                  <TabsContent value="all" className="mt-0 pr-2 sm:pr-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4 animate-pulse">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">Loading pawsome posts...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 p-8 sm:p-12 text-center">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full gradient-hero flex items-center justify-center">
                          <span className="text-4xl sm:text-5xl animate-bounce-gentle">🐾</span>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-foreground mb-2">No posts yet!</p>
                        <p className="text-muted-foreground text-sm mb-4">Be the first to share something pawsome</p>
                        {!user && (
                          <Link to="/auth">
                            <Button className="btn-primary rounded-xl font-bold">
                              Join the Pack
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        )}
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
                        <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mb-4 animate-pulse">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">Loading your feed...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 p-8 sm:p-12 text-center">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-foreground mb-2">
                          {user ? "Your feed is empty!" : "Join the pack!"}
                        </p>
                        <p className="text-muted-foreground text-sm mb-4">
                          {user ? "Follow some adorable pets to see their posts! 🐶" : "Login to see posts from pets you follow"}
                        </p>
                        <Link to="/explore">
                          <Button className="btn-accent rounded-xl font-bold">
                            <Search className="h-4 w-4 mr-2" />
                            Find Pets to Follow
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
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sunshine/10">
                        <TrendingUp className="h-4 w-4 text-sunshine" />
                      </div>
                      Trending Pets 🔥
                    </h3>
                    <div className="space-y-1">
                      {trendingPets.slice(0, 5).map((pet, index) => (
                        <Link 
                          key={pet.id} 
                          to={`/pet/${pet.id}`}
                          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-[0.98]"
                        >
                          <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}</span>
                          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
                            {pet.avatar_url ? (
                              <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                              <PawPrint className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{pet.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{pet.species}{pet.breed && ` • ${pet.breed}`}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link to="/explore" className="block mt-3 sm:mt-4">
                      <Button variant="outline" className="w-full rounded-xl font-bold text-sm h-11 border-2 hover:bg-primary/5 hover:border-primary transition-all">
                        See All Pets
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card border border-border/50 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg gradient-fun">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    Quick Actions
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <Link to="/explore" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-accent/10 hover:bg-accent/15 transition-all active:scale-[0.98]">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0 shadow-md">
                        <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm">Explore Pets</p>
                        <p className="text-xs text-muted-foreground truncate">Discover new friends 🐾</p>
                      </div>
                    </Link>
                    <Link to="/messages" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-lavender/10 hover:bg-lavender/15 transition-all active:scale-[0.98]">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-fun flex items-center justify-center flex-shrink-0 shadow-md">
                        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm">Messages</p>
                        <p className="text-xs text-muted-foreground truncate">Chat with pet parents 💬</p>
                      </div>
                    </Link>
                    {user && (
                      <Link to="/pets/new" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-primary/10 hover:bg-primary/15 transition-all active:scale-[0.98]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-md">
                          <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm">Add New Pet</p>
                          <p className="text-xs text-muted-foreground truncate">Create a profile 🐾</p>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Index;
