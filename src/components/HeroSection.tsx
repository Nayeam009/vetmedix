import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, MessageCircle, Users, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroCatSocial from '@/assets/hero-cat-social.png';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-[hsl(35,30%,92%)] min-h-[calc(100vh-4rem)]">
      {/* Decorative paw prints */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left paw */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12 text-4xl sm:text-5xl opacity-20 rotate-[-15deg]">
          🐾
        </div>
        {/* Bottom left paw */}
        <div className="absolute bottom-20 left-4 sm:bottom-32 sm:left-8 text-3xl sm:text-4xl opacity-15 rotate-[25deg]">
          🐾
        </div>
        {/* Top right paw */}
        <div className="absolute top-20 right-8 sm:top-16 sm:right-20 text-3xl opacity-15 rotate-[10deg]">
          🐾
        </div>
        {/* Floating hearts */}
        <div className="absolute top-1/4 right-1/4 hidden lg:block">
          <Heart className="h-5 w-5 text-rose-400/40 fill-rose-400/40 animate-pulse" />
        </div>
        <div className="absolute top-1/3 right-1/3 hidden lg:block">
          <Heart className="h-4 w-4 text-rose-400/30 fill-rose-400/30 animate-pulse delay-300" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-8rem)] lg:min-h-0">
          {/* Content */}
          <div className="space-y-5 sm:space-y-6 order-2 lg:order-1 text-center lg:text-left pb-8 lg:pb-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-foreground/10 text-foreground text-xs sm:text-sm font-medium shadow-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>10,000+ Pet Parents Connected</span>
            </div>
            
            {/* Main headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight tracking-tight">
              VETMEDIX SOCIAL:
              <br />
              <span className="text-foreground">WHERE PETS</span>
              <br />
              <span className="text-primary">CONNECT & SHARE</span>
            </h1>
            
            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Create profiles, share photos, find playdates, and join the ultimate community for pets and their people.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
              <Link to="/feed" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full gap-2 text-sm sm:text-base px-8 h-12 sm:h-14 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  JOIN THE PET COMMUNITY
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link to="/shop" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full text-sm sm:text-base px-8 h-12 sm:h-14 font-semibold border-2 border-foreground/20 hover:bg-foreground/5 hover:border-foreground/40 transition-all duration-300"
                >
                  Explore Shop
                </Button>
              </Link>
            </div>

            {/* Social features */}
            <div className="flex flex-wrap gap-4 sm:gap-6 pt-4 sm:pt-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2 group">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Camera className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground/80">Share Photos</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground/80">Get Likes</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <MessageCircle className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground/80">Connect</span>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="relative order-1 lg:order-2 flex justify-center items-center">
            <div className="relative">
              {/* Floating pet avatars - decorative */}
              <div className="absolute -top-4 -left-4 sm:-top-8 sm:-left-8 z-10 hidden sm:block">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl sm:text-3xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                  🐕
                </div>
              </div>
              <div className="absolute top-8 -right-2 sm:top-4 sm:-right-8 z-10 hidden sm:block">
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-xl sm:text-2xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                  🐰
                </div>
              </div>
              <div className="absolute bottom-20 -right-4 sm:bottom-24 sm:-right-12 z-10 hidden sm:block">
                <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-xl sm:text-2xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                  🐦
                </div>
              </div>
              <div className="absolute bottom-8 -left-2 sm:bottom-12 sm:-left-10 z-10 hidden sm:block">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-lg sm:text-xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>
                  🐹
                </div>
              </div>

              {/* Likes badge */}
              <div className="absolute top-1/3 right-0 sm:-right-4 z-20">
                <div className="bg-white rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg flex items-center gap-1.5 sm:gap-2 animate-pulse">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 fill-rose-500" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">likes</span>
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
                className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] lg:w-[450px] lg:h-[450px] object-contain drop-shadow-xl"
              />

              {/* Bottom stats badge */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-white rounded-2xl px-4 py-2 sm:px-6 sm:py-3 shadow-lg">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-foreground">5K+</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Pet Profiles</p>
                    </div>
                    <div className="h-8 w-px bg-foreground/10" />
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-foreground">20K+</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Daily Posts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
