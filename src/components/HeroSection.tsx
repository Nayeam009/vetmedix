import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, ShieldCheck, Truck } from 'lucide-react';
import heroPets from '@/assets/hero-pets.jpg';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Content */}
          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Heart className="h-4 w-4" />
              Trusted by 10,000+ Pet Owners
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Everything for Your{' '}
              <span className="text-gradient">Pet & Farm</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Delivered to your Thana. Premium pet food, medicine, and farm supplies — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Shop Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl">
                Find a Clinic
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm">Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-sm">Genuine Products</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-5 w-5 text-primary" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative lg:h-[500px] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <img
              src={heroPets}
              alt="Happy pets - dog and cat"
              className="relative w-full h-full object-cover rounded-3xl shadow-2xl"
            />
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 md:bottom-8 md:left-8 bg-card p-4 rounded-2xl shadow-lg animate-float">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🐾</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">500+ Clinics</p>
                  <p className="text-sm text-muted-foreground">Across Bangladesh</p>
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
