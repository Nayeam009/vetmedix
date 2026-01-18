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
        {/* Hero Section - Playful & Eye-Pleasing */}
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] sm:min-h-[85vh] lg:min-h-[90vh]">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(35,60%,95%)] via-[hsl(15,70%,95%)] to-[hsl(200,60%,95%)] animate-gradient-slow" />
          
          {/* Playful floating shapes - hidden on very small screens for performance */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large decorative circles */}
            <div className="absolute -top-20 -right-20 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-32 -left-32 w-56 h-56 sm:w-80 sm:h-80 md:w-[30rem] md:h-[30rem] rounded-full bg-gradient-to-tr from-accent/15 to-lavender/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            
            {/* Floating paw prints - responsive positioning */}
            <div className="absolute top-[5%] left-[3%] text-2xl sm:text-4xl lg:text-5xl opacity-15 animate-float rotate-[-15deg]">🐾</div>
            <div className="absolute bottom-[25%] left-[5%] text-xl sm:text-3xl opacity-10 animate-float rotate-[25deg] hidden sm:block" style={{ animationDelay: '1s' }}>🐾</div>
            <div className="absolute top-[8%] right-[5%] text-xl sm:text-3xl opacity-10 animate-float rotate-[10deg]" style={{ animationDelay: '2s' }}>🐾</div>
            <div className="absolute bottom-[30%] right-[3%] text-xl sm:text-2xl opacity-10 animate-float rotate-[-20deg] hidden sm:block" style={{ animationDelay: '3s' }}>🐾</div>
            
            {/* Floating hearts - hidden on mobile for cleaner look */}
            <div className="absolute top-[20%] right-[15%] hidden md:block">
              <Heart className="h-5 w-5 lg:h-6 lg:w-6 text-rose-400/40 fill-rose-400/40 animate-bounce-gentle" />
            </div>
            <div className="absolute bottom-[35%] right-[10%] hidden lg:block">
              <Heart className="h-4 w-4 text-primary/30 fill-primary/30 animate-bounce-gentle" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* Sparkle elements - hidden on small screens */}
            <div className="absolute top-[25%] left-[20%] hidden lg:block">
              <Sparkles className="h-5 w-5 text-sunshine/50 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="absolute top-[45%] right-[12%] hidden lg:block">
              <Star className="h-4 w-4 text-sunshine/40 fill-sunshine/40 animate-pulse" style={{ animationDelay: '0.8s' }} />
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-16 relative z-10">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center min-h-[calc(100vh-8rem)] sm:min-h-0">
              {/* Content */}
              <div className="space-y-4 sm:space-y-5 lg:space-y-6 order-2 lg:order-1 text-center lg:text-left animate-fade-in">
                {/* Animated Badge */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 text-foreground text-[10px] sm:text-xs md:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 cursor-default">
                  <div className="relative flex-shrink-0">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-accent rounded-full animate-ping" />
                  </div>
                  <span className="whitespace-nowrap">10,000+ Pet Parents</span>
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sunshine flex-shrink-0" />
                </div>
                
                {/* Main headline with gradient text - responsive sizing */}
                <h1 className="text-[1.75rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-display font-bold tracking-tight">
                  <span className="text-foreground block">VETMEDIX</span>
                  <span className="block mt-1 sm:mt-2">
                    <span className="bg-gradient-to-r from-primary via-accent to-lavender bg-clip-text text-transparent">One Stop Pet Care</span>
                  </span>
                  <span className="block">
                    <span className="text-gradient-fun">Community</span>
                  </span>
                </h1>
                
                {/* Description - responsive text */}
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-md sm:max-w-lg mx-auto lg:mx-0 leading-relaxed px-2 sm:px-0">
                  Your complete destination for pet care — connect with other pet parents, book vet appointments, shop essentials, and share precious moments! 🐾
                </p>

                {/* CTA Buttons - improved mobile layout */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-3 justify-center lg:justify-start px-2 sm:px-0">
                  {user && pets.length === 0 ? (
                    <Link to="/pets/new" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm px-6 sm:px-8 h-11 sm:h-12 font-bold shadow-button hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
                      >
                        <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" />
                        Add Your First Pet
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : !user ? (
                    <Link to="/auth" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm px-6 sm:px-8 h-11 sm:h-12 font-bold shadow-button hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
                      >
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" />
                        JOIN THE COMMUNITY
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/feed" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm px-6 sm:px-8 h-11 sm:h-12 font-bold shadow-button hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
                      >
                        <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" />
                        GO TO FEED
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Social features - better mobile layout */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 justify-center lg:justify-start px-2 sm:px-0">
                  {[
                    { icon: Camera, label: 'Share Photos', color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
                    { icon: Heart, label: 'Get Likes', color: 'from-rose-500/20 to-rose-500/5', iconColor: 'text-rose-500' },
                    { icon: MessageCircle, label: 'Connect', color: 'from-accent/20 to-accent/5', iconColor: 'text-accent' },
                  ].map((feature) => (
                    <div 
                      key={feature.label}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default group"
                    >
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <feature.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${feature.iconColor}`} />
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold text-foreground/80">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Illustration - Enhanced mobile */}
              <div className="relative order-1 lg:order-2 flex justify-center items-center py-4 sm:py-0">
                <div className="relative">
                  {/* Glowing background circle - responsive */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-lavender/10 blur-2xl animate-pulse-slow" />
                  </div>
                  
                  {/* Floating pet avatars - responsive positioning */}
                  <div className="absolute -top-2 -left-2 sm:-top-6 sm:-left-8 z-10">
                    <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-lg sm:text-2xl animate-float ring-2 sm:ring-4 ring-white/50">
                      🐕
                    </div>
                  </div>
                  <div className="absolute top-4 -right-1 sm:top-2 sm:-right-6 z-10">
                    <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-base sm:text-xl animate-float ring-2 sm:ring-4 ring-white/50" style={{ animationDelay: '0.5s' }}>
                      🐰
                    </div>
                  </div>
                  <div className="absolute bottom-16 -right-2 sm:bottom-20 sm:-right-10 z-10">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-base sm:text-xl animate-float ring-2 sm:ring-4 ring-white/50" style={{ animationDelay: '1s' }}>
                      🐦
                    </div>
                  </div>
                  <div className="absolute bottom-6 -left-1 sm:bottom-10 sm:-left-8 z-10">
                    <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg flex items-center justify-center text-sm sm:text-lg animate-float ring-2 sm:ring-4 ring-white/50" style={{ animationDelay: '1.5s' }}>
                      🐹
                    </div>
                  </div>
                  
                  {/* Additional floating pet - hidden on mobile */}
                  <div className="absolute top-1/2 -right-4 sm:-right-12 z-10 hidden sm:block">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-lg flex items-center justify-center text-base sm:text-lg animate-float ring-2 sm:ring-4 ring-white/50" style={{ animationDelay: '2s' }}>
                      🐱
                    </div>
                  </div>

                  {/* Animated likes notification - responsive */}
                  <div className="absolute top-[25%] right-0 sm:right-2 z-20">
                    <div className="bg-white rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg flex items-center gap-1.5 animate-bounce-gentle border border-rose-100">
                      <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 fill-rose-500 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-bold text-foreground">+99</span>
                    </div>
                  </div>
                  
                  {/* New follower notification - hidden on small mobile */}
                  <div className="absolute top-[50%] -left-2 sm:-left-8 z-20 hidden sm:block">
                    <div className="bg-white rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-lg flex items-center gap-1.5 animate-bounce-gentle border border-accent/20" style={{ animationDelay: '1s' }}>
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                      <span className="text-[10px] sm:text-xs font-bold text-foreground">New!</span>
                    </div>
                  </div>

                  {/* Main illustration - responsive sizing */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/15 to-transparent rounded-full blur-2xl scale-75" />
                    <img
                      src={heroCatSocial}
                      alt="Cute cat using VetMedix social app on smartphone, representing pet social media community"
                      width={400}
                      height={400}
                      fetchPriority="high"
                      decoding="async"
                      className="relative w-[180px] h-[180px] sm:w-[280px] sm:h-[280px] md:w-[340px] md:h-[340px] lg:w-[380px] lg:h-[380px] object-contain drop-shadow-xl"
                    />
                  </div>

                  {/* Stats badge - responsive */}
                  <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-6 sm:py-3 shadow-lg border border-primary/10">
                      <div className="flex items-center gap-3 sm:gap-6">
                        <div className="text-center">
                          <p className="text-base sm:text-xl font-bold text-foreground">5K+</p>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">Profiles</p>
                        </div>
                        <div className="h-6 sm:h-8 w-px bg-foreground/10" />
                        <div className="text-center">
                          <p className="text-base sm:text-xl font-bold text-foreground">20K+</p>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">Posts</p>
                        </div>
                        <div className="h-6 sm:h-8 w-px bg-foreground/10 hidden xs:block sm:block" />
                        <div className="text-center hidden xs:block sm:block">
                          <p className="text-base sm:text-xl font-bold text-foreground">50K+</p>
                          <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">Pets</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative wave at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-20 overflow-hidden">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
              <path 
                d="M0,60 C300,100 400,20 600,60 C800,100 900,20 1200,60 L1200,120 L0,120 Z" 
                className="fill-white"
              />
            </svg>
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
