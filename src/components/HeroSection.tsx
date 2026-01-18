import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, ShieldCheck, Clock, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroPets from '@/assets/hero-pets.jpg';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/50 to-white">
      {/* Subtle decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16 lg:py-20 relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-5 sm:space-y-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/90 border border-orange-100 text-primary text-xs sm:text-sm font-semibold shadow-sm">
              <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 fill-red-500" />
              Trusted by 10,000+ Pet Owners
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              Best Destination{' '}
              <br className="hidden sm:block" />
              <span className="text-primary">For Your Pets</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Premium pet food, medicine, accessories and farm supplies — all delivered to your doorstep across Bangladesh.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:pt-2">
              <Link to="/shop" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 font-semibold shadow-md">
                  Shop Now
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link to="/clinics" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 font-semibold border-2 hover:bg-muted/50">
                  Find a Clinic
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 sm:gap-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-teal-500 flex items-center justify-center">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground/80">Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-violet-500 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground/80">Genuine Products</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground/80">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative">
              <img
                src={heroPets}
                alt="Happy pets including a dog and cat together, representing VET-MEDIX pet care services"
                width={600}
                height={420}
                fetchPriority="high"
                decoding="async"
                className="w-full h-[240px] sm:h-[300px] md:h-[360px] lg:h-[420px] object-cover rounded-2xl sm:rounded-3xl shadow-lg"
              />
              {/* Floating badge */}
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-md">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-teal-500 flex items-center justify-center">
                    <span className="text-base sm:text-lg">🐾</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-xs sm:text-sm">500+ Clinics</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Across Bangladesh</p>
                  </div>
                </div>
              </div>
              {/* Stats badge */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 bg-white/95 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-md">
                <p className="text-lg sm:text-xl font-bold text-primary">2000+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;