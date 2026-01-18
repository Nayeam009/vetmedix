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
  Star, TrendingUp, Share2
} from 'lucide-react';
import type { Pet } from '@/types/social';
import heroCatSocial from '@/assets/hero-cat-social.png';

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
        {/* Hero Section - Cute Pet Social Theme */}
        <section className="relative overflow-hidden bg-[hsl(35,30%,92%)] min-h-[70vh] sm:min-h-[80vh] lg:min-h-[85vh]">
          {/* Decorative paw prints */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-6 left-4 sm:top-10 sm:left-10 text-3xl sm:text-4xl lg:text-5xl opacity-15 rotate-[-15deg]">🐾</div>
            <div className="absolute bottom-24 left-4 sm:bottom-28 sm:left-8 text-2xl sm:text-3xl opacity-10 rotate-[25deg]">🐾</div>
            <div className="absolute top-16 right-4 sm:top-14 sm:right-16 text-2xl sm:text-3xl opacity-10 rotate-[10deg]">🐾</div>
            <div className="absolute bottom-12 right-8 text-2xl opacity-10 rotate-[-20deg] hidden sm:block">🐾</div>
            <div className="absolute top-1/4 right-1/4 hidden lg:block">
              <Heart className="h-4 w-4 text-rose-400/30 fill-rose-400/30 animate-pulse" />
            </div>
            <div className="absolute top-1/3 left-1/4 hidden lg:block">
              <Heart className="h-3 w-3 text-rose-400/25 fill-rose-400/25 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-14 relative">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              {/* Content */}
              <div className="space-y-4 sm:space-y-5 order-2 lg:order-1 text-center lg:text-left pb-6 lg:pb-0">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/90 border border-foreground/10 text-foreground text-xs sm:text-sm font-medium shadow-sm">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span>10,000+ Pet Parents Connected</span>
                </div>
                
                {/* Main headline */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
                  VETMEDIX SOCIAL:
                  <br />
                  <span className="text-foreground">WHERE PETS</span>
                  <br />
                  <span className="text-primary">CONNECT & SHARE</span>
                </h1>
                
                {/* Description */}
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Create profiles, share photos, find playdates, and join the ultimate community for pets and their people.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
                  {user && pets.length === 0 ? (
                    <Link to="/pets/new" className="w-full sm:w-auto">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full gap-2 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-13 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <PawPrint className="h-4 w-4 sm:h-5 sm:w-5" />
                        Add Your First Pet
                      </Button>
                    </Link>
                  ) : !user ? (
                    <Link to="/auth" className="w-full sm:w-auto">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full gap-2 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-13 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        JOIN THE PET COMMUNITY
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/feed" className="w-full sm:w-auto">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full gap-2 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-13 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        GO TO FEED
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                  )}
                  <Link to="/shop" className="w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto rounded-full text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-13 font-semibold border-2 border-foreground/20 bg-transparent hover:bg-foreground/5 hover:border-foreground/40 transition-all duration-300"
                    >
                      Explore Shop
                    </Button>
                  </Link>
                </div>

                {/* Social features */}
                <div className="flex flex-wrap gap-3 sm:gap-5 pt-3 sm:pt-5 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 group">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground/80">Share Photos</span>
                  </div>
                  <div className="flex items-center gap-2 group">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground/80">Get Likes</span>
                  </div>
                  <div className="flex items-center gap-2 group">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground/80">Connect</span>
                  </div>
                </div>
              </div>

              {/* Hero Illustration */}
              <div className="relative order-1 lg:order-2 flex justify-center items-center">
                <div className="relative">
                  {/* Floating pet avatars */}
                  <div className="absolute -top-2 -left-2 sm:-top-6 sm:-left-6 z-10">
                    <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-xl sm:text-2xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                      🐕
                    </div>
                  </div>
                  <div className="absolute top-4 -right-1 sm:top-2 sm:-right-6 z-10">
                    <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-lg sm:text-xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                      🐰
                    </div>
                  </div>
                  <div className="absolute bottom-16 -right-2 sm:bottom-20 sm:-right-8 z-10">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-lg sm:text-xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                      🐦
                    </div>
                  </div>
                  <div className="absolute bottom-6 -left-1 sm:bottom-10 sm:-left-8 z-10">
                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg flex items-center justify-center text-base sm:text-lg animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>
                      🐹
                    </div>
                  </div>

                  {/* Likes badge */}
                  <div className="absolute top-1/3 right-0 sm:-right-2 z-20">
                    <div className="bg-white rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg flex items-center gap-1.5 animate-pulse">
                      <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 fill-rose-500" />
                      <span className="text-[10px] sm:text-xs font-bold text-foreground">likes</span>
                    </div>
                  </div>

                  {/* Main illustration */}
                  <img
                    src={heroCatSocial}
                    alt="Cute cat using VetMedix social app on smartphone, representing pet social media community"
                    width={400}
                    height={400}
                    fetchPriority="high"
                    decoding="async"
                    className="w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] md:w-[360px] md:h-[360px] lg:w-[400px] lg:h-[400px] object-contain drop-shadow-xl"
                  />

                  {/* Bottom stats badge */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-white rounded-xl sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-2.5 shadow-lg">
                      <div className="flex items-center gap-3 sm:gap-5">
                        <div className="text-center">
                          <p className="text-base sm:text-lg font-bold text-foreground">5K+</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">Pet Profiles</p>
                        </div>
                        <div className="h-6 sm:h-8 w-px bg-foreground/10" />
                        <div className="text-center">
                          <p className="text-base sm:text-lg font-bold text-foreground">20K+</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">Daily Posts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                      <Sparkles className="h-4 w-4 text-white" />
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
