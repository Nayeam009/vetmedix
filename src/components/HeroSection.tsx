import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, ShieldCheck, Clock, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroPets from '@/assets/hero-pets.jpg';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-light/50 via-lavender-light/30 to-peach/20">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-mint/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 right-1/4 w-48 h-48 bg-lavender/20 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14 lg:py-16 relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-5 animate-slide-up order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/15 text-mint-light border border-mint/20 text-sm font-semibold backdrop-blur-sm">
              <Heart className="h-4 w-4 fill-current" />
              Trusted by 10,000+ Pet Owners
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Your One-Stop{' '}
              <br className="hidden sm:block" />
              <span className="text-gradient-fun">Pet Care Destination</span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
              Premium pet food, medicine, accessories and farm supplies — all delivered to your doorstep across Bangladesh.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link to="/shop">
                <Button size="lg" className="group w-full sm:w-auto bg-gradient-to-r from-primary to-coral-light hover:from-coral-dark hover:to-primary text-white shadow-button hover:shadow-hover transition-all duration-300">
                  Shop Now
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/clinics">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-mint/40 text-mint hover:bg-mint/10 hover:border-mint transition-all duration-300">
                  Find a Clinic
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky/20 to-sky-light/30 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-sky" />
                </div>
                <span className="text-sm font-medium text-foreground/80">Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-mint/20 to-mint-light/30 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-mint" />
                </div>
                <span className="text-sm font-medium text-foreground/80">Genuine Products</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-lavender/20 to-lavender-light/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-lavender" />
                </div>
                <span className="text-sm font-medium text-foreground/80">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative order-1 lg:order-2 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-mint/20 via-lavender/15 to-primary/20 rounded-3xl blur-2xl scale-105" />
            <div className="relative">
              <img
                src={heroPets}
                alt="Happy pets - dog and cat"
                className="w-full h-[280px] md:h-[340px] lg:h-[400px] object-cover rounded-3xl shadow-hover border-4 border-white/60"
              />
              {/* Floating badge */}
              <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-card animate-float border border-mint/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-mint to-mint-light flex items-center justify-center">
                    <span className="text-lg">🐾</span>
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">500+ Clinics</p>
                    <p className="text-xs text-muted-foreground">Across Bangladesh</p>
                  </div>
                </div>
              </div>
              {/* Stats badge */}
              <div className="absolute top-3 right-3 md:top-6 md:right-6 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-card border border-lavender/20">
                <p className="text-xl font-display font-bold text-gradient-fun">2000+</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;