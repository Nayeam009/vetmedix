import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroPets from '@/assets/hero-pets.jpg';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 animate-slide-up order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Trusted by 10,000+ Pet Owners
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Best Destination{' '}
              <br className="hidden sm:block" />
              <span className="text-gradient">For Your Pets</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              Premium pet food, medicine, accessories and farm supplies — all delivered to your doorstep across Bangladesh.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/shop">
                <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                  Shop Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/clinics">
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                  Find a Clinic
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm font-medium">Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm font-medium">Genuine Products</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm font-medium">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative order-1 lg:order-2 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-3xl scale-110"></div>
            <div className="relative">
              <img
                src={heroPets}
                alt="Happy pets - dog and cat"
                className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover rounded-3xl shadow-hover"
              />
              {/* Floating badge */}
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 bg-card p-4 rounded-2xl shadow-lg animate-float border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🐾</span>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">500+ Clinics</p>
                    <p className="text-sm text-muted-foreground">Across Bangladesh</p>
                  </div>
                </div>
              </div>
              {/* Stats badge */}
              <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-card p-3 rounded-xl shadow-lg border border-border">
                <p className="text-2xl font-display font-bold text-primary">2000+</p>
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