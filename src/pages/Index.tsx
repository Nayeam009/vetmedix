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
        <section className="relative overflow-hidden min-h-[75vh] sm:min-h-[85vh] lg:min-h-[90vh]">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(35,60%,95%)] via-[hsl(15,70%,95%)] to-[hsl(200,60%,95%)] animate-gradient-slow" />
          
          {/* Playful floating shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large decorative circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 sm:w-[30rem] sm:h-[30rem] rounded-full bg-gradient-to-tr from-accent/15 to-lavender/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            
            {/* Floating paw prints with rotation */}
            <div className="absolute top-[8%] left-[5%] text-4xl sm:text-5xl lg:text-6xl opacity-20 animate-float rotate-[-15deg]">🐾</div>
            <div className="absolute bottom-[15%] left-[8%] text-3xl sm:text-4xl opacity-15 animate-float rotate-[25deg]" style={{ animationDelay: '1s' }}>🐾</div>
            <div className="absolute top-[12%] right-[8%] text-3xl sm:text-4xl opacity-15 animate-float rotate-[10deg]" style={{ animationDelay: '2s' }}>🐾</div>
            <div className="absolute bottom-[20%] right-[5%] text-3xl opacity-15 animate-float rotate-[-20deg]" style={{ animationDelay: '3s' }}>🐾</div>
            <div className="absolute top-[40%] left-[3%] text-2xl opacity-10 animate-float hidden lg:block" style={{ animationDelay: '1.5s' }}>🐾</div>
            
            {/* Floating hearts with different sizes and delays */}
            <div className="absolute top-[20%] right-[20%] hidden sm:block">
              <Heart className="h-6 w-6 text-rose-400/40 fill-rose-400/40 animate-bounce-gentle" style={{ animationDelay: '0s' }} />
            </div>
            <div className="absolute top-[35%] left-[15%] hidden lg:block">
              <Heart className="h-4 w-4 text-rose-400/30 fill-rose-400/30 animate-bounce-gentle" style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="absolute bottom-[30%] right-[12%] hidden sm:block">
              <Heart className="h-5 w-5 text-primary/30 fill-primary/30 animate-bounce-gentle" style={{ animationDelay: '1s' }} />
            </div>
            <div className="absolute top-[60%] right-[25%] hidden lg:block">
              <Heart className="h-3 w-3 text-accent/40 fill-accent/40 animate-bounce-gentle" style={{ animationDelay: '1.5s' }} />
            </div>
            
            {/* Sparkle elements */}
            <div className="absolute top-[25%] left-[25%] hidden lg:block">
              <Sparkles className="h-5 w-5 text-sunshine/50 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="absolute bottom-[35%] left-[20%] hidden md:block">
              <Sparkles className="h-4 w-4 text-primary/40 animate-pulse" style={{ animationDelay: '1.2s' }} />
            </div>
            <div className="absolute top-[45%] right-[15%] hidden lg:block">
              <Star className="h-4 w-4 text-sunshine/40 fill-sunshine/40 animate-pulse" style={{ animationDelay: '0.8s' }} />
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">
              {/* Content */}
              <div className="space-y-5 sm:space-y-6 order-2 lg:order-1 text-center lg:text-left pb-8 lg:pb-0 animate-fade-in">
                {/* Animated Badge */}
                <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 text-foreground text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default">
                  <div className="relative">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-accent rounded-full animate-ping" />
                  </div>
                  <span>10,000+ Pet Parents Connected</span>
                  <Sparkles className="h-3.5 w-3.5 text-sunshine" />
                </div>
                
                {/* Main headline with gradient text */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.05] tracking-tight">
                  <span className="text-foreground block animate-slide-up">VETMEDIX</span>
                  <span className="text-foreground block animate-slide-up" style={{ animationDelay: '0.1s' }}>SOCIAL:</span>
                  <span className="block mt-1 sm:mt-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <span className="text-gradient-fun">WHERE PETS</span>
                  </span>
                  <span className="block animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <span className="bg-gradient-to-r from-primary via-accent to-lavender bg-clip-text text-transparent">CONNECT & SHARE</span>
                  </span>
                </h1>
                
                {/* Description with better styling */}
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  Create adorable profiles, share precious moments, find playdates, and join the 
                  <span className="text-primary font-semibold"> ultimate community</span> for pets and their people! 🐾
                </p>

                {/* CTA Buttons with enhanced styling */}
                <div className="flex flex-col sm:flex-row gap-4 pt-3 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  {user && pets.length === 0 ? (
                    <Link to="/pets/new" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm sm:text-base px-7 sm:px-10 h-12 sm:h-14 font-bold shadow-button hover:shadow-hover hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                      >
                        <PawPrint className="h-5 w-5 group-hover:animate-wiggle" />
                        Add Your First Pet
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : !user ? (
                    <Link to="/auth" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm sm:text-base px-7 sm:px-10 h-12 sm:h-14 font-bold shadow-button hover:shadow-hover hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                      >
                        <Sparkles className="h-5 w-5 group-hover:animate-wiggle" />
                        JOIN THE COMMUNITY
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/feed" className="w-full sm:w-auto group">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto gradient-primary text-white rounded-full gap-2 text-sm sm:text-base px-7 sm:px-10 h-12 sm:h-14 font-bold shadow-button hover:shadow-hover hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                      >
                        <PawPrint className="h-5 w-5 group-hover:animate-wiggle" />
                        GO TO FEED
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                  <Link to="/shop" className="w-full sm:w-auto group">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto rounded-full text-sm sm:text-base px-7 sm:px-10 h-12 sm:h-14 font-semibold border-2 border-foreground/15 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      🛍️ Explore Shop
                    </Button>
                  </Link>
                </div>

                {/* Social features with playful cards */}
                <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 sm:pt-6 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  {[
                    { icon: Camera, label: 'Share Photos', color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
                    { icon: Heart, label: 'Get Likes', color: 'from-rose-500/20 to-rose-500/5', iconColor: 'text-rose-500' },
                    { icon: MessageCircle, label: 'Connect', color: 'from-accent/20 to-accent/5', iconColor: 'text-accent' },
                  ].map((feature, index) => (
                    <div 
                      key={feature.label}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 cursor-default group"
                      style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                    >
                      <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <feature.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${feature.iconColor}`} />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-foreground/80">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Illustration - Enhanced */}
              <div className="relative order-1 lg:order-2 flex justify-center items-center animate-scale-in">
                <div className="relative">
                  {/* Glowing background circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px] lg:w-[480px] lg:h-[480px] rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-lavender/10 blur-2xl animate-pulse-slow" />
                  </div>
                  
                  {/* Floating pet avatars with enhanced animations */}
                  <div className="absolute -top-4 -left-4 sm:-top-8 sm:-left-10 z-10">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white shadow-xl flex items-center justify-center text-2xl sm:text-3xl animate-float ring-4 ring-white/50" style={{ animationDelay: '0s' }}>
                      🐕
                    </div>
                  </div>
                  <div className="absolute top-6 -right-2 sm:top-4 sm:-right-8 z-10">
                    <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-white shadow-xl flex items-center justify-center text-xl sm:text-2xl animate-float ring-4 ring-white/50" style={{ animationDelay: '0.5s' }}>
                      🐰
                    </div>
                  </div>
                  <div className="absolute bottom-20 -right-4 sm:bottom-24 sm:-right-12 z-10">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white shadow-xl flex items-center justify-center text-xl sm:text-2xl animate-float ring-4 ring-white/50" style={{ animationDelay: '1s' }}>
                      🐦
                    </div>
                  </div>
                  <div className="absolute bottom-8 -left-3 sm:bottom-12 sm:-left-10 z-10">
                    <div className="h-10 w-10 sm:h-13 sm:w-13 rounded-full bg-white shadow-xl flex items-center justify-center text-lg sm:text-xl animate-float ring-4 ring-white/50" style={{ animationDelay: '1.5s' }}>
                      🐹
                    </div>
                  </div>
                  
                  {/* Additional floating pet */}
                  <div className="absolute top-1/2 -right-6 sm:-right-14 z-10 hidden sm:block">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white shadow-xl flex items-center justify-center text-lg sm:text-xl animate-float ring-4 ring-white/50" style={{ animationDelay: '2s' }}>
                      🐱
                    </div>
                  </div>

                  {/* Animated likes notification */}
                  <div className="absolute top-[30%] right-2 sm:right-0 z-20">
                    <div className="bg-white rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-xl flex items-center gap-2 animate-bounce-gentle border-2 border-rose-100">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 fill-rose-500 animate-pulse" />
                      <span className="text-xs sm:text-sm font-bold text-foreground">+99 likes!</span>
                    </div>
                  </div>
                  
                  {/* New follower notification */}
                  <div className="absolute top-[55%] -left-4 sm:-left-10 z-20 hidden sm:block">
                    <div className="bg-white rounded-full px-3 py-1.5 shadow-xl flex items-center gap-2 animate-bounce-gentle border-2 border-accent/20" style={{ animationDelay: '1s' }}>
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-xs font-bold text-foreground">New follower!</span>
                    </div>
                  </div>

                  {/* Main illustration with glow effect */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl scale-75" />
                    <img
                      src={heroCatSocial}
                      alt="Cute cat using VetMedix social app on smartphone, representing pet social media community"
                      width={400}
                      height={400}
                      fetchPriority="high"
                      decoding="async"
                      className="relative w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] lg:w-[440px] lg:h-[440px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Enhanced bottom stats badge */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl px-5 py-3 sm:px-8 sm:py-4 shadow-xl border border-primary/10">
                      <div className="flex items-center gap-4 sm:gap-8">
                        <div className="text-center group cursor-default">
                          <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">5K+</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Pet Profiles</p>
                        </div>
                        <div className="h-8 sm:h-10 w-px bg-gradient-to-b from-transparent via-foreground/20 to-transparent" />
                        <div className="text-center group cursor-default">
                          <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-accent transition-colors">20K+</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Daily Posts</p>
                        </div>
                        <div className="h-8 sm:h-10 w-px bg-gradient-to-b from-transparent via-foreground/20 to-transparent hidden sm:block" />
                        <div className="text-center group cursor-default hidden sm:block">
                          <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-lavender transition-colors">50K+</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Happy Pets</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative wave at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 overflow-hidden">
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
